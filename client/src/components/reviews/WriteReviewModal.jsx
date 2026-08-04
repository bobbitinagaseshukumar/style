import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiStar, FiCheckCircle, FiUpload, FiX, FiCrop } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../config/api';

const WriteReviewModal = ({ order, item, onClose, onReviewSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  
  // Array of final uploaded or base64 image strings
  const [images, setImages] = useState([]);
  
  const [recommend, setRecommend] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Crop state
  const [cropFile, setCropFile] = useState(null); // The original file selected
  const [cropImageUrl, setCropImageUrl] = useState(null); // Data URL of the selected file to draw on canvas
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  
  // Crop interactions
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const imgElement = useRef(new Image());
  
  // Canvas configuration
  const CANVAS_SIZE = 300;
  
  useEffect(() => {
    if (cropImageUrl) {
      imgElement.current.src = cropImageUrl;
      imgElement.current.onload = () => {
        setScale(1);
        // Center the image initially
        const minDim = Math.min(imgElement.current.width, imgElement.current.height);
        const initialScale = CANVAS_SIZE / minDim;
        setScale(initialScale);
        
        setPosition({
          x: (CANVAS_SIZE - imgElement.current.width * initialScale) / 2,
          y: (CANVAS_SIZE - imgElement.current.height * initialScale) / 2
        });
        
        drawCanvas();
      };
    }
  }, [cropImageUrl]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Draw background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Draw image
    if (imgElement.current.src) {
      ctx.drawImage(
        imgElement.current,
        position.x,
        position.y,
        imgElement.current.width * scale,
        imgElement.current.height * scale
      );
    }
    
    // Draw semi-transparent overlay outside crop area (in this case, full canvas IS the crop area, so we skip overlay, but we can draw a border)
    ctx.strokeStyle = '#D4AF37'; // gold
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  };

  useEffect(() => {
    if (isCropModalOpen) {
      drawCanvas();
    }
  }, [scale, position, isCropModalOpen]);

  const handleFileSelect = (e) => {
    if (images.length >= 5) {
      toast.error('You can only upload up to 5 images.');
      return;
    }
    const file = e.target.files[0];
    if (file) {
      setCropFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCropImageUrl(e.target.result);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    e.target.value = null;
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = 0.1;
    const newScale = e.deltaY > 0 ? scale - zoomFactor : scale + zoomFactor;
    setScale(Math.min(Math.max(0.1, newScale), 5));
  };

  const applyCrop = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const base64Image = canvas.toDataURL('image/jpeg', 0.9);
    
    try {
      // Try to upload to server
      const blob = await (await fetch(base64Image)).blob();
      const formData = new FormData();
      formData.append('image', blob, 'review-crop.jpg');
      
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data?.success && res.data.url) {
        setImages([...images, res.data.url]);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.log('Upload failed, falling back to base64', err);
      // Fallback to base64
      setImages([...images, base64Image]);
    }
    
    setIsCropModalOpen(false);
    setCropImageUrl(null);
    setCropFile(null);
  };

  const handleRemoveImage = (idx) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      return toast.error('Please enter a review description.');
    }

    try {
      setSubmitting(true);
      const res = await api.post('/reviews', {
        productId: item.productId || item.product?.id,
        orderId: order.id,
        rating,
        title: title || 'Verified Experience',
        comment,
        images,
        recommend,
        isAnonymous,
      });

      toast.success('Thank you! Your verified review has been published. 🎉');
      if (onReviewSubmitted) onReviewSubmitted(res.data?.data);
      onClose();
    } catch (err) {
      console.error('Submit review error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#0D0D12] border border-white/10 max-w-lg w-full rounded-3xl overflow-hidden shadow-2xl text-white"
        >
          <div className="bg-[#141414] p-5 flex items-center justify-between border-b border-white/10">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                <FiCheckCircle size={12} /> Verified Purchase Review
              </span>
              <h3 className="font-serif font-bold text-lg text-white">Review Product</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition"><FiX size={20}/></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Product Summary Header */}
            {item && (
              <div className="flex items-center gap-3 bg-black/30 p-3 rounded-2xl border border-white/5">
                {item.product?.images?.[0]?.url && (
                  <img
                    src={item.product.images[0].url}
                    alt={item.product?.name}
                    className="w-14 h-16 object-cover rounded-xl shrink-0"
                  />
                )}
                <div>
                  <p className="text-xs font-bold text-white line-clamp-1">{item.product?.name || item.name || 'Product'}</p>
                  <p className="text-[10px] text-white/50 mt-0.5">
                    {item.size ? `Size: ${item.size}` : ''} {item.color ? `· Color: ${item.color}` : ''}
                  </p>
                  {order && <p className="text-[10px] text-emerald-400 font-semibold mt-1">Delivered Order #{order.orderNumber}</p>}
                </div>
              </div>
            )}

            {/* Interactive Star Rating */}
            <div className="text-center space-y-1">
              <label className="block text-xs font-bold uppercase text-gray-300">Overall Rating</label>
              <div className="flex justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition transform hover:scale-125 focus:outline-none cursor-pointer"
                  >
                    <FiStar
                      size={28}
                      className={`${
                        (hoverRating || rating) >= star
                          ? 'text-[#D4AF37] fill-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]'
                          : 'text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Review Title */}
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Review Headline / Title</label>
              <input
                type="text"
                placeholder="e.g. Excellent Fabric & Comfortable Fit!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-xs text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            {/* Detailed Review Description */}
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Detailed Review Description</label>
              <textarea
                rows={4}
                required
                placeholder="Share your experience regarding quality, comfort, color accuracy, and sizing..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-xs text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            {/* Photo Upload Section */}
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-2">Add Product Photos (Optional - Max 5)</label>
              <div className="flex flex-wrap gap-3">
                {images.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={url} alt="Review upload" className="w-16 h-16 object-cover rounded-xl border border-white/10" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 text-[10px] opacity-0 group-hover:opacity-100 transition"
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                ))}
                
                {images.length < 5 && (
                  <label className="w-16 h-16 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-white/50 hover:text-white hover:border-white/50 transition cursor-pointer bg-black/20">
                    <FiUpload size={18} className="mb-1" />
                    <span className="text-[9px] font-bold">Add Photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                  </label>
                )}
              </div>
            </div>

            {/* Checkbox options */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-white/10 text-xs text-gray-300">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={recommend}
                  onChange={(e) => setRecommend(e.target.checked)}
                  className="rounded text-[#D4AF37] focus:ring-[#D4AF37] cursor-pointer"
                />
                <span className="group-hover:text-white transition">I recommend this product</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded text-[#D4AF37] focus:ring-[#D4AF37] cursor-pointer"
                />
                <span className="group-hover:text-white transition">Submit as Anonymous</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-gray-300 hover:bg-white/5 cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-amber-400 text-black font-extrabold text-xs transition cursor-pointer"
              >
                {submitting ? 'Publishing...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* CROP MODAL */}
      <AnimatePresence>
        {isCropModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#141414] border border-white/10 p-6 rounded-3xl max-w-sm w-full flex flex-col items-center shadow-2xl"
            >
              <h3 className="text-white font-bold mb-4 flex items-center gap-2"><FiCrop /> Crop Photo</h3>
              
              <div 
                className="relative overflow-hidden rounded-xl border-2 border-white/10 cursor-move bg-black"
                style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
              >
                <canvas
                  ref={canvasRef}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                  className="w-full h-full"
                />
                
                {/* Visual guides for crop area */}
                <div className="absolute inset-0 pointer-events-none border border-[#D4AF37]/50 border-dashed" />
              </div>
              
              <p className="text-gray-400 text-[10px] mt-3 text-center">
                Drag to pan. Scroll to zoom.
              </p>
              
              {/* Zoom slider */}
              <div className="w-full mt-3 flex items-center gap-2">
                <span className="text-white/50 text-xs">1x</span>
                <input 
                  type="range" 
                  min="0.1" 
                  max="3" 
                  step="0.1" 
                  value={scale} 
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="flex-1 accent-[#D4AF37]"
                />
                <span className="text-white/50 text-xs">3x</span>
              </div>
              
              <div className="flex w-full gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setIsCropModalOpen(false); setCropImageUrl(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white text-xs font-bold hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyCrop}
                  className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] text-black text-xs font-bold hover:bg-amber-400 transition"
                >
                  Apply Crop
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default WriteReviewModal;
