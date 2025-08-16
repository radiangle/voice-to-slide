'use client';

import { useState, useRef } from 'react';
import { Upload, Mic, Square, Play, Pause } from 'lucide-react';

interface Slide {
  id: number;
  title: string;
  content: string;
  speakerNotes: string;
}

interface AudioUploaderProps {
  onProcessing: (processing: boolean) => void;
  onSlidesGenerated: (slides: Slide[]) => void;
  isProcessing: boolean;
}

export default function AudioUploader({ onProcessing, onSlidesGenerated, isProcessing }: AudioUploaderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Error accessing microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const playRecording = () => {
    if (audioBlob && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioBlob(file);
    }
  };

  const processAudio = async () => {
    if (!audioBlob) return;

    onProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcribeResponse.ok) {
        throw new Error('Transcription failed');
      }

      const { transcription } = await transcribeResponse.json();

      const slidesResponse = await fetch('/api/generate-slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcription }),
      });

      if (!slidesResponse.ok) {
        throw new Error('Slide generation failed');
      }

      const { slides } = await slidesResponse.json();
      onSlidesGenerated(slides);

    } catch (error) {
      console.error('Error processing audio:', error);
      alert('Error processing audio. Please try again.');
      onProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Upload or Record Audio
          </h2>
          <p className="text-gray-600">
            Record up to 3 minutes or upload an audio file to generate your slides
          </p>
        </div>

        <div className="space-y-6">
          {/* Recording Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <div className="mb-4">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="inline-flex items-center px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    disabled={isProcessing}
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    Start Recording
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="inline-flex items-center px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <Square className="w-5 h-5 mr-2" />
                    Stop Recording
                  </button>
                )}
              </div>
              
              {isRecording && (
                <div className="text-red-500 font-mono text-lg">
                  Recording: {formatTime(recordingTime)}
                </div>
              )}
            </div>
          </div>

          {/* File Upload Section */}
          <div className="text-center">
            <p className="text-gray-500 mb-4">or</p>
            <label className="cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Click to upload audio file</p>
                <p className="text-sm text-gray-400 mt-2">MP3, WAV, M4A up to 25MB</p>
              </div>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isProcessing}
              />
            </label>
          </div>

          {/* Audio Preview */}
          {audioBlob && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Audio ready</span>
                <button
                  onClick={playRecording}
                  className="inline-flex items-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  disabled={isProcessing}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              </div>
              <audio
                ref={audioRef}
                src={audioBlob ? URL.createObjectURL(audioBlob) : undefined}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            </div>
          )}

          {/* Process Button */}
          {audioBlob && (
            <button
              onClick={processAudio}
              disabled={isProcessing}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing Audio...
                </div>
              ) : (
                'Generate Slides'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}