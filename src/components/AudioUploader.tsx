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
    if (!audioBlob) {
      alert('No audio file selected. Please record or upload an audio file first.');
      return;
    }

    console.log('Processing audio blob:', audioBlob.size, 'bytes, type:', audioBlob.type);

    if (audioBlob.size === 0) {
      alert('Audio file is empty. Please try recording or uploading again.');
      return;
    }

    onProcessing(true);
    
    try {
      const formData = new FormData();
      
      // Create a proper filename if the blob doesn't have one
      const filename = audioBlob instanceof File ? audioBlob.name : 'recording.wav';
      const file = new File([audioBlob], filename, { 
        type: audioBlob.type || 'audio/wav' 
      });
      
      console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
      formData.append('audio', file);

      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json();
        throw new Error(errorData.error || 'Transcription failed');
      }

      const { transcription } = await transcribeResponse.json();
      console.log('Transcription received:', transcription.substring(0, 100) + '...');

      const slidesResponse = await fetch('/api/generate-slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcription }),
      });

      if (!slidesResponse.ok) {
        const errorData = await slidesResponse.json();
        throw new Error(errorData.error || 'Slide generation failed');
      }

      const { slides } = await slidesResponse.json();
      onSlidesGenerated(slides);

    } catch (error) {
      console.error('Error processing audio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error processing audio: ${errorMessage}`);
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
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 tracking-tight">
            Upload or Record Audio
          </h2>
          <p className="text-xl font-medium text-gray-600 leading-relaxed tracking-wide">
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
                    className="inline-flex items-center px-8 py-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium tracking-wide text-lg"
                    disabled={isProcessing}
                  >
                    <Mic className="w-6 h-6 mr-3" />
                    Start Recording
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="inline-flex items-center px-8 py-4 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium tracking-wide text-lg"
                  >
                    <Square className="w-6 h-6 mr-3" />
                    Stop Recording
                  </button>
                )}
              </div>
              
              {isRecording && (
                <div className="text-red-500 font-bold text-2xl tracking-wider">
                  Recording: {formatTime(recordingTime)}
                </div>
              )}
            </div>
          </div>

          {/* File Upload Section */}
          <div className="text-center">
            <p className="text-gray-500 mb-6 text-lg font-medium tracking-wide">or</p>
            <label className="cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-400 transition-colors">
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-xl font-medium tracking-wide">Click to upload audio file</p>
                <p className="text-lg text-gray-400 mt-3 font-medium">MP3, WAV, M4A up to 25MB</p>
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
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-lg font-medium tracking-wide">Audio ready</span>
                <button
                  onClick={playRecording}
                  className="inline-flex items-center px-5 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  disabled={isProcessing}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
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
              className="w-full py-5 px-8 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xl tracking-wide"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
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