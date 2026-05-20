"use client";
import { useState, useRef, useEffect } from "react";

interface VoiceInputProps {
  onVoiceInput: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceInput({ onVoiceInput, disabled = false }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [permissionAsked, setPermissionAsked] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize speech recognition on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech Recognition API not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onVoiceInput(finalTranscript.trim());
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    const permissionAskedBefore = localStorage.getItem("voicePermissionAsked");
    if (permissionAskedBefore) {
      setPermissionAsked(true);
    }
  }, [onVoiceInput]);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      console.error("Speech Recognition not available");
      return;
    }

    // If permission was never asked, show prompt first
    if (!permissionAsked) {
      setShowPermissionPrompt(true);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Error starting recognition:", e);
      }
    }
  };

  const handlePermissionConfirm = () => {
    localStorage.setItem("voicePermissionAsked", "true");
    setPermissionAsked(true);
    setShowPermissionPrompt(false);

    // Start listening after permission confirmation
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Error starting recognition:", e);
      }
    }
  };

  const handlePermissionCancel = () => {
    setShowPermissionPrompt(false);
  };

  return (
    <>
      {/* Microphone Button */}
      <button
        onClick={handleMicClick}
        disabled={disabled}
        title="Voice input"
        style={{
          background: isListening ? "var(--accent)" : "transparent",
          border: `1.5px solid ${isListening ? "var(--accent)" : "var(--border)"}`,
          color: isListening ? "#fff" : "var(--text)",
          borderRadius: "10px",
          padding: "11px 14px",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          fontWeight: 600,
          transition: "all 0.2s",
          opacity: disabled ? 0.6 : 1,
          flexShrink: 0,
          position: "relative",
        }}
      >
        🎤
        {isListening && (
          <span
            style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              width: "12px",
              height: "12px",
              background: "#ef4444",
              borderRadius: "50%",
              animation: "pulse 1s infinite",
            }}
          />
        )}
      </button>

      {/* Permission Prompt Modal */}
      {showPermissionPrompt && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowPermissionPrompt(false)}
        >
          <div
            style={{
              background: "var(--bg-1)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              padding: "28px 24px",
              maxWidth: "400px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              animation: "slideUp 0.3s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: "12px",
              }}
            >
              🎤 Enable Microphone?
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-2)",
                lineHeight: 1.6,
                marginBottom: "24px",
              }}
            >
              This will allow us to recognize your voice input for searching movies. You'll only see this once.
            </p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={handlePermissionCancel}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  borderRadius: "10px",
                  padding: "10px 18px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                Cancel
              </button>
              <button
                onClick={handlePermissionConfirm}
                style={{
                  background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                  border: "none",
                  color: "#fff",
                  borderRadius: "10px",
                  padding: "10px 18px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(99,102,241,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(99,102,241,0.3)";
                }}
              >
                Enable
              </button>
            </div>
          </div>

          <style>{`
            @keyframes slideUp {
              from {
                transform: translateY(20px);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
            @keyframes pulse {
              0%, 100% {
                opacity: 1;
              }
              50% {
                opacity: 0.5;
              }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
