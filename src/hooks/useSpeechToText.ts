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
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const isListeningRef = useRef(false);
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
      isListeningRef.current = false;
      setIsListening(false);
    };

    recognition.onerror = (e) => {
      // "no-speech" and "aborted" are expected — don't treat as error
      if (e.error === "no-speech" || e.error === "aborted") {
        isListeningRef.current = false;
        setIsListening(false);
        return;
      }
      // For other errors (e.g. "not-allowed"), still update state
      isListeningRef.current = false;
      setIsListening(false);
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
      isListeningRef.current = false;
      setIsListening(false);
    };
  }, []);

  const start = useCallback(() => {
    if (!recognitionRef.current || isListeningRef.current) return;
    try {
      recognitionRef.current.start();
      isListeningRef.current = true;
      setIsListening(true);
    } catch {
      // start() throws if already running — ignore
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
      start();
    }
  }, [start, stop]);

  return { isListening, isSupported, start, stop, toggle };
}
