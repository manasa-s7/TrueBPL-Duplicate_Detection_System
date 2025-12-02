import { useState, useRef } from 'react';
import { Camera, Upload, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BeneficiaryRegistrationProps {
  onSuccess?: () => void;
}

export default function BeneficiaryRegistration({ onSuccess }: BeneficiaryRegistrationProps) {
  const [formData, setFormData] = useState({
    card_number: '',
    name: '',
    phone: '',
    address: '',
  });
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [useCamera, setUseCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setUseCamera(true);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to access camera' });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setUseCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!capturedImage) {
      setMessage({ type: 'error', text: 'Please capture or upload a face image' });
      return;
    }

    if (!formData.card_number || !formData.name) {
      setMessage({ type: 'error', text: 'Card number and name are required' });
      return;
    }

    setLoading(true);

    try {
      const existingCheck = await supabase
        .from('beneficiaries')
        .select('id')
        .eq('card_number', formData.card_number)
        .maybeSingle();

      if (existingCheck.data) {
        setMessage({ type: 'error', text: 'Card number already registered' });
        setLoading(false);
        return;
      }

      const beneficiaryData = {
        ...formData,
        face_image_url: capturedImage.substring(0, 100) + '...',
        face_embedding: capturedImage,
        status: 'active',
      };

      const { data, error } = await supabase
        .from('beneficiaries')
        .insert([beneficiaryData])
        .select();

      if (error) throw error;

      setMessage({ type: 'success', text: 'Beneficiary registered successfully!' });
      setFormData({ card_number: '', name: '', phone: '', address: '' });
      setCapturedImage(null);

      if (onSuccess) {
        setTimeout(() => onSuccess(), 1000);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <UserPlus className="w-6 h-6 text-blue-600 mr-3" />
        <h2 className="text-2xl font-bold text-gray-900">Register New Beneficiary</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              BPL Card Number *
            </label>
            <input
              type="text"
              value={formData.card_number}
              onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Face Image *
          </label>

          <div className="space-y-4">
            {!capturedImage && !useCamera && (
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Use Camera
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Image
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}

            {useCamera && (
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  autoPlay
                  className="w-full max-w-md rounded-lg border-2 border-gray-300"
                />
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Capture Photo
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {capturedImage && (
              <div className="space-y-4">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full max-w-md rounded-lg border-2 border-green-500"
                />
                <button
                  type="button"
                  onClick={() => setCapturedImage(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Retake Photo
                </button>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Registering...' : 'Register Beneficiary'}
        </button>
      </form>
    </div>
  );
}
