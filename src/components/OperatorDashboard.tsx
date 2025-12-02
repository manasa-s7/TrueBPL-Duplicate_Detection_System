import { useState, useEffect, useRef } from 'react';
import { Camera, Upload, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { RationShop, VerificationResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000';

export default function OperatorDashboard() {
  const [shops, setShops] = useState<RationShop[]>([]);
  const [selectedShop, setSelectedShop] = useState<string>('');
  const [cardNumber, setCardNumber] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState(false);
  const [operatorId, setOperatorId] = useState('OP001');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResponse | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      const { data, error } = await supabase
        .from('ration_shops')
        .select('*')
        .order('name');

      if (error) throw error;
      setShops(data || []);
      if (data && data.length > 0) {
        setSelectedShop(data[0].id);
      }
    } catch (error) {
      console.error('Error loading shops:', error);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setUseCamera(true);
    } catch (error) {
      alert('Failed to access camera');
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

  const handleVerify = async () => {
    if (!cardNumber || !capturedImage || !selectedShop) {
      alert('Please enter card number, select shop, and capture/upload image');
      return;
    }

    setVerifying(true);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          card_number: cardNumber,
          shop_id: selectedShop,
          captured_image_base64: capturedImage,
          operator_id: operatorId,
          items_collected: [],
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success && (!data.alerts || data.alerts.length === 0)) {
        setTimeout(() => {
          setCardNumber('');
          setCapturedImage(null);
          setResult(null);
        }, 5000);
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Verification service unavailable. Please ensure backend is running.',
        alerts: [],
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-white">Ration Shop Operator</h1>
            <p className="mt-2 text-sm text-blue-100">
              Verify beneficiary identity and prevent duplicate distributions
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Ration Shop *
              </label>
              <select
                value={selectedShop}
                onChange={(e) => setSelectedShop(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name} - {shop.shop_code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                BPL Card Number *
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="Enter card number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Capture Beneficiary Face *
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
                    className="w-full rounded-lg border-2 border-gray-300"
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
                    className="w-full rounded-lg border-2 border-green-500"
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

          <button
            onClick={handleVerify}
            disabled={verifying || !cardNumber || !capturedImage || !selectedShop}
            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {verifying ? (
              'Verifying...'
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Verify Beneficiary
              </>
            )}
          </button>

          {result && (
            <div
              className={`p-6 rounded-lg border-2 ${
                result.success && (!result.alerts || result.alerts.length === 0)
                  ? 'bg-green-50 border-green-500'
                  : result.success
                  ? 'bg-yellow-50 border-yellow-500'
                  : 'bg-red-50 border-red-500'
              }`}
            >
              <div className="flex items-start">
                {result.success && (!result.alerts || result.alerts.length === 0) ? (
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-1" />
                ) : result.success ? (
                  <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-1" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-1" />
                )}
                <div className="flex-1">
                  <h3
                    className={`text-lg font-bold mb-2 ${
                      result.success && (!result.alerts || result.alerts.length === 0)
                        ? 'text-green-900'
                        : result.success
                        ? 'text-yellow-900'
                        : 'text-red-900'
                    }`}
                  >
                    {result.message}
                  </h3>

                  {result.beneficiary && (
                    <div className="mb-3 space-y-1">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Name:</span> {result.beneficiary.name}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Card:</span>{' '}
                        {result.beneficiary.card_number}
                      </p>
                      {result.confidence && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Match Confidence:</span>{' '}
                          {result.confidence.toFixed(1)}%
                        </p>
                      )}
                    </div>
                  )}

                  {result.alerts && result.alerts.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium text-red-900">Alerts:</h4>
                      {result.alerts.map((alert, index) => (
                        <div
                          key={index}
                          className="p-3 bg-white rounded border border-red-200"
                        >
                          <p className="text-sm font-medium text-red-800">
                            {alert.alert_type.replace(/_/g, ' ').toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-700 mt-1">{alert.description}</p>
                          <span
                            className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded ${
                              alert.severity === 'critical'
                                ? 'bg-red-100 text-red-800'
                                : alert.severity === 'high'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {alert.severity.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
