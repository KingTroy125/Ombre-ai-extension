import { useCallback, useEffect, useRef, useState } from "react";

// Minimal shape of the Web Speech API we rely on
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
}

type OnResult = (text: string, isFinal: boolean) => void;

export function useSpeechToText(onResult: OnResult) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const isListeningRef = useRef(false);
  const isStartingRef = useRef(false);
  const restartTimerRef = useRef<number | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      setIsSupported(false);
      setError("Voice input is not supported in this browser.");
      return;
    }
    setIsSupported(true);

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) final += transcript;
        else interim += transcript;
      }
      if (final) onResultRef.current(final.trim(), true);
      else if (interim) onResultRef.current(interim.trim(), false);
    };

    recognition.onend = () => {
      if (!isListeningRef.current) {
        setIsListening(false);
        return;
      }

      // Chrome can end a recognition session during a normal pause. Restart
      // it while the user still expects the mic to be active.
      restartTimerRef.current = window.setTimeout(() => {
        if (!isListeningRef.current) return;
        try {
          recognition.start();
          setIsListening(true);
        } catch {
          isListeningRef.current = false;
          setIsListening(false);
        }
      }, 150);
    };

    recognition.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      isListeningRef.current = false;
      setIsListening(false);
      setError(
        e.error === "not-allowed"
          ? "Microphone permission was denied. Allow microphone access and try again."
          : "Voice input is unavailable right now. Try again.",
      );
    };

    recognitionRef.current = recognition;
    return () => {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      try {
        recognition.stop();
      } catch {
        // already stopped
      }
      if (restartTimerRef.current !== null) {
        window.clearTimeout(restartTimerRef.current);
      }
      isListeningRef.current = false;
      setIsListening(false);
    };
  }, []);

  const start = useCallback(async () => {
    if (!recognitionRef.current || isListeningRef.current || isStartingRef.current) return;
    isStartingRef.current = true;
    setError(null);

    try {
      // Step 1: Request the optional "microphone" permission via the Chrome
      // permissions API. This triggers Chrome's native extension-permission
      // dialog and persists the grant across sessions.
      const hasPermission = await new Promise<boolean>((resolve) => {
        if (typeof chrome !== "undefined" && chrome.permissions?.request) {
          chrome.permissions.request({ permissions: ["microphone"] }, (granted) => {
            resolve(!!granted);
          });
        } else {
          // Not running inside the extension shell (e.g. local dev)
          resolve(true);
        }
      });

      if (!hasPermission) {
        throw new DOMException("Permission denied by user.", "NotAllowedError");
      }

      // Step 2: Warm up the media stream so the browser opens the mic device.
      // Stop the tracks immediately — Web Speech API manages its own stream.
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("microphone-unavailable");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());

      recognitionRef.current.start();
      isListeningRef.current = true;
      setIsListening(true);
    } catch (cause) {
      isListeningRef.current = false;
      setIsListening(false);
      const errorName = cause instanceof DOMException ? cause.name : "";
      const errorMsg = cause instanceof Error ? cause.message : "";
      if (errorName === "NotAllowedError") {
        setError(
          "Microphone access was denied. Click the mic button again to grant permission, or allow it in Chrome's extension settings (chrome://extensions → Ombre AI → Site access → Microphone).",
        );
      } else if (errorMsg === "microphone-unavailable") {
        setError("Microphone hardware is unavailable. Check that a mic is connected.");
      } else {
        setError("Could not start the microphone. Check browser permissions and try again.");
      }
    } finally {
      isStartingRef.current = false;
    }
  }, []);

  const stop = useCallback(() => {
    if (!isListeningRef.current) return;
    try {
      recognitionRef.current?.stop();
    } catch {
      // already stopped
    }
    isListeningRef.current = false;
    setIsListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (isListeningRef.current) {
      stop();
    } else {
      void start();
    }
  }, [start, stop]);

  return { isListening, isSupported, error, start, stop, toggle };
}
