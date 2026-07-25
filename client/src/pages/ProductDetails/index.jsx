import React, {
  useState, useEffect, useRef, useCallback
} from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiStar, FiHeart, FiShoppingBag, FiTruck, FiShield, FiRefreshCw,
  FiChevronRight, FiChevronLeft, FiMinus, FiPlus, FiMapPin, FiX,
  FiShare2, FiZoomIn, FiMaximize2, FiCheck, FiAlertCircle, FiBell,
  FiMessageSquare, FiThumbsUp, FiPackage, FiTag, FiInfo,
} from 'react-icons/fi';
import {
  FaWhatsapp, FaFacebook, FaTelegram, FaTwitter
} from 'react-icons/fa';
import api from '../../config/api';
import { addToCart } from '../../redux/cart/cartSlice';
import { addToWishlist, removeFromWishlist } from '../../redux/wishlist/wishlistSlice';
import { formatCurrency } from '../../utils/formatCurrency';
import { toast } from 'react-toastify';

/* ═══════════════════════════════════════════════════════════════
   HELPER: parse JSON safely
═══════════════════════════════════════════════════════════════ */
const safeJSON = (val, fallback = []) => {
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val || '[]'); } catch { return fallback; }
};

/* ═══════════════════════════════════════════════════════════════
   STAR RATING DISPLAY
═══════════════════════════════════════════════════════════════ */
const Stars = ({ rating = 0, size = 14, showEmpty = true }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(n => (
      <FiStar
        key={n}
        size={size}
        className={n <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : showEmpty ? 'text-gray-200' : 'text-gray-300'}
      />
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   TRUST BADGES
═══════════════════════════════════════════════════════════════ */
const TrustBadges = () => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
    {[
      { icon: FiShield, label: '100% Original', sub: 'Verified products' },
      { icon: FiRefreshCw, label: 'Easy Returns', sub: '7-day return policy' },
      { icon: FiTruck, label: 'Fast Delivery', sub: '2-5 business days' },
      { icon: FiPackage, label: 'Secure Packing', sub: 'Quality guaranteed' },
    ].map(b => (
      <div key={b.label} className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 rounded-2xl border border-gray-100 text-center">
        <div className="w-9 h-9 rounded-xl bg-yellow-50 border border-yellow-100 flex items-center justify-center">
          <b.icon size={15} className="text-yellow-600" />
        </div>
        <p className="text-xs font-bold text-gray-800">{b.label}</p>
        <p className="text-[10px] text-gray-400">{b.sub}</p>
      </div>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   FULLSCREEN GALLERY MODAL
═══════════════════════════════════════════════════════════════ */
const FullscreenGallery = ({ images, initialIdx, onClose }) => {
  const [idx, setIdx] = useState(initialIdx);
  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center"
    >
      <button onClick={onClose} className="absolute top-5 right-5 text-white/60 hover:text-white p-2 rounded-xl hover:bg-white/10 transition">
        <FiX size={22} />
      </button>
      <div className="relative w-full max-w-3xl px-4 flex items-center justify-center">
        <button onClick={prev} className="absolute left-2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
          <FiChevronLeft size={22} />
        </button>
        <motion.img
          key={idx} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          src={images[idx]?.url || images[idx]} alt=""
          className="max-h-[80vh] object-contain rounded-2xl"
        />
        <button onClick={next} className="absolute right-2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
          <FiChevronRight size={22} />
        </button>
      </div>
      <div className="flex gap-2 mt-5 overflow-x-auto px-4 pb-2">
        {images.map((img, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className={`w-14 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition ${i === idx ? 'border-yellow-400' : 'border-white/10 opacity-50 hover:opacity-80'}`}>
            <img src={img?.url || img} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      <p className="text-white/40 text-xs mt-3">{idx + 1} / {images.length}</p>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   IMAGE GALLERY (Left Panel)
═══════════════════════════════════════════════════════════════ */
const ImageGallery = ({ images, selectedIdx, onChange }) => {
  const [zoom, setZoom] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [fullscreen, setFullscreen] = useState(false);
  const imgRef = useRef();

  const onMouseMove = useCallback((e) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  }, []);

  const allImages = images?.length > 0 ? images : [{ url: 'https://placehold.co/600x800/f3f4f6/9ca3af?text=No+Image' }];
  const mainImg = allImages[selectedIdx]?.url || allImages[selectedIdx] || allImages[0]?.url;

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div
        ref={imgRef}
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={onMouseMove}
        className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 cursor-zoom-in group"
      >
        <motion.img
          key={mainImg}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
          src={mainImg} alt=""
          className="w-full h-full object-cover"
          style={zoom ? {
            transform: 'scale(2.2)',
            transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
            transition: 'transform 0.1s ease',
          } : { transition: 'transform 0.3s ease' }}
        />
        {/* Controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition">
          <button onClick={() => setFullscreen(true)}
            className="p-2 rounded-xl bg-white/90 shadow text-gray-700 hover:bg-white transition">
            <FiMaximize2 size={14} />
          </button>
        </div>
        {/* Nav arrows */}
        {allImages.length > 1 && (
          <>
            <button onClick={() => onChange((selectedIdx - 1 + allImages.length) % allImages.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 shadow text-gray-700 hover:bg-white transition opacity-0 group-hover:opacity-100">
              <FiChevronLeft size={16} />
            </button>
            <button onClick={() => onChange((selectedIdx + 1) % allImages.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 shadow text-gray-700 hover:bg-white transition opacity-0 group-hover:opacity-100">
              <FiChevronRight size={16} />
            </button>
          </>
        )}
        {/* Image counter */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/40 text-white text-[10px] px-2.5 py-1 rounded-full font-medium">
          {selectedIdx + 1} / {allImages.length}
        </div>
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {allImages.map((img, i) => (
            <button key={i} onClick={() => onChange(i)}
              className={`w-16 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition ${i === selectedIdx ? 'border-yellow-400 shadow-md shadow-yellow-100' : 'border-gray-200 opacity-60 hover:opacity-100 hover:border-gray-300'}`}>
              <img src={img?.url || img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen */}
      <AnimatePresence>
        {fullscreen && (
          <FullscreenGallery images={allImages} initialIdx={selectedIdx} onClose={() => setFullscreen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   RATING BREAKDOWN BAR
═══════════════════════════════════════════════════════════════ */
const RatingBreakdown = ({ reviews }) => {
  const counts = [5, 4, 3, 2, 1].map(n => ({
    n,
    count: reviews.filter(r => r.rating === n).length,
  }));
  const total = reviews.length || 1;
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0.0';
  return (
    <div className="flex gap-6 items-center">
      <div className="text-center flex-shrink-0">
        <p className="text-5xl font-black text-gray-900">{avg}</p>
        <Stars rating={parseFloat(avg)} size={14} />
        <p className="text-xs text-gray-400 mt-1">{reviews.length} reviews</p>
      </div>
      <div className="flex-1 space-y-1.5">
        {counts.map(({ n, count }) => (
          <div key={n} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-3">{n}</span>
            <FiStar size={10} className="fill-amber-400 text-amber-400 flex-shrink-0" />
            <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full transition-all duration-700"
                style={{ width: `${(count / total) * 100}%` }} />
            </div>
            <span className="text-xs text-gray-400 w-5 text-right">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   REVIEW CARD
═══════════════════════════════════════════════════════════════ */
const ReviewCard = ({ review }) => (
  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold text-sm flex-shrink-0">
          {review.user?.fullName?.[0] || 'C'}
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">{review.user?.fullName || 'Customer'}</p>
          <div className="flex items-center gap-2">
            <Stars rating={review.rating} size={11} />
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full">✓ Verified</span>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-gray-400 flex-shrink-0">
        {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </div>
    {review.title && <p className="font-bold text-gray-800 text-sm">"{review.title}"</p>}
    <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
    <div className="flex items-center gap-3 pt-1">
      <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition">
        <FiThumbsUp size={11} /> Helpful
      </button>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   RELATED PRODUCT MINI CARD
═══════════════════════════════════════════════════════════════ */
const MiniProductCard = ({ product }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const img = product.images?.[0]?.url || product.images?.[0] || 'https://placehold.co/300x400/f3f4f6/9ca3af?text=Product';
  return (
    <div className="group cursor-pointer flex-shrink-0 w-44" onClick={() => navigate(`/product/${product.slug}`)}>
      <div className="relative rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 aspect-[3/4] mb-2">
        <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        {product.discountPercent > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            -{product.discountPercent}%
          </span>
        )}
        <button
          onClick={e => { e.stopPropagation(); dispatch(addToCart({ id: product.id, name: product.name, price: product.discountPrice || product.price, image: img, quantity: 1 })); toast.success('Added!'); }}
          className="absolute bottom-2 inset-x-2 py-2 bg-black/80 text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1"
        >
          <FiShoppingBag size={12} /> Quick Add
        </button>
      </div>
      <p className="text-xs font-bold text-gray-800 truncate">{product.name}</p>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-sm font-black text-gray-900">{formatCurrency(product.discountPrice || product.price)}</span>
        {product.discountPercent > 0 && (
          <span className="text-[10px] text-gray-400 line-through">{formatCurrency(product.price)}</span>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN PRODUCT DETAILS PAGE
═══════════════════════════════════════════════════════════════ */
const ProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const wishlistItems = useSelector(s => s.wishlist?.items || []);

  /* ── State ─────────────────────────────────────────────────── */
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Variant selection
  const [colorVariants, setColorVariants] = useState([]);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [availableSizes, setAvailableSizes] = useState([]);

  // UI
  const [pincode, setPincode] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSort, setReviewSort] = useState('newest');
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [stickyVisible, setStickyVisible] = useState(false);
  const infoRef = useRef();

  /* ── Derived from selected color ─────────────────────────── */
  const selectedColor = colorVariants[selectedColorIdx] || {};
  const colorImages = selectedColor.images?.length > 0
    ? selectedColor.images.map(u => ({ url: u }))
    : product?.images || [];
  const currentPrice = selectedColor.price ? parseFloat(selectedColor.price) : (product?.price || 0);
  const currentDiscount = selectedColor.discountPercent ? parseFloat(selectedColor.discountPercent) : (product?.discountPercent || 0);
  const currentDiscountPrice = currentDiscount > 0 ? +(currentPrice * (1 - currentDiscount / 100)).toFixed(2) : currentPrice;
  const savedAmount = currentPrice - currentDiscountPrice;
  const currentStock = (() => {
    if (selectedSize && selectedColor.sizes?.length > 0) {
      const s = selectedColor.sizes.find(s => s.size === selectedSize);
      return parseInt(s?.stock || 0);
    }
    return parseInt(selectedColor.stock || product?.stock || 0);
  })();
  const isWishlisted = product && wishlistItems.some(i => i.id === product.id);

  /* ── Fetch product ────────────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/products/${slug}`);
        const prod = data?.data;
        if (!prod) return;
        setProduct(prod);

        // Parse colors & sizes
        const colors = safeJSON(prod.colors, []);
        const sizes = safeJSON(prod.sizes, []);
        setColorVariants(colors);
        setAvailableSizes(sizes);
        if (sizes.length > 0) setSelectedSize(sizes[0]);
        setSelectedImgIdx(0);

        // Save recently viewed
        try {
          const saved = safeJSON(localStorage.getItem('styleverse_recently_viewed'));
          const item = { id: prod.id, name: prod.name, slug: prod.slug, price: prod.discountPrice || prod.price, image: prod.images?.[0]?.url };
          const next = [item, ...saved.filter(p => p.id !== prod.id)].slice(0, 10);
          localStorage.setItem('styleverse_recently_viewed', JSON.stringify(next));
        } catch {}

        // Fetch related + reviews in background
        Promise.all([
          api.get(`/products?category=${prod.categoryId}&limit=8`).catch(() => ({ data: null })),
          api.get(`/reviews/product/${prod.id}`).catch(() => ({ data: null })),
        ]).then(([relRes, revRes]) => {
          const related = relRes.data?.data?.products?.filter(p => p.id !== prod.id) || [];
          setRelatedProducts(related);
          setReviews(revRes.data?.data?.reviews || []);
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo(0, 0);
  }, [slug]);

  /* ── Sticky bar on scroll ─────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => setStickyVisible(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── When color changes, reset image index ────────────────── */
  useEffect(() => setSelectedImgIdx(0), [selectedColorIdx]);

  /* ── Handlers ─────────────────────────────────────────────── */
  const handleAddToCart = () => {
    if (!product) return;
    if (availableSizes.length > 0 && !selectedSize) { toast.error('Please select a size'); return; }
    if (currentStock === 0) { toast.error('Out of stock'); return; }
    dispatch(addToCart({
      id: product.id,
      name: product.name,
      price: currentDiscountPrice,
      image: colorImages[0]?.url || colorImages[0],
      size: selectedSize,
      color: selectedColor.name || '',
      quantity,
    }));
    toast.success(`"${product.name}" added to cart!`);
  };

  const handleBuyNow = () => { handleAddToCart(); navigate('/cart'); };

  const handleWishlist = () => {
    if (!product) return;
    if (isWishlisted) {
      dispatch(removeFromWishlist(product.id));
      toast.info('Removed from wishlist');
    } else {
      dispatch(addToWishlist({ id: product.id, name: product.name, price: currentDiscountPrice, image: colorImages[0]?.url, slug: product.slug }));
      toast.success('Added to wishlist!');
    }
  };

  const handlePincode = (e) => {
    e.preventDefault();
    if (pincode.length !== 6 || isNaN(pincode)) { toast.error('Enter a valid 6-digit PIN'); return; }
    const d = new Date(Date.now() + 3 * 86400000).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
    setDeliveryInfo({ date: d, free: currentDiscountPrice > 499, cod: true });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reviews', { productId: product.id, ...reviewForm });
      toast.success('Review posted!');
      setShowReviewForm(false);
      setReviewForm({ rating: 5, title: '', comment: '' });
      const { data } = await api.get(`/reviews/product/${product.id}`);
      setReviews(data?.data?.reviews || []);
    } catch { toast.error('Login required to post a review'); }
  };

  const shareUrl = window.location.href;
  const sortedReviews = [...reviews].sort((a, b) => {
    if (reviewSort === 'highest') return b.rating - a.rating;
    if (reviewSort === 'lowest') return a.rating - b.rating;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  /* ── Loading skeleton ─────────────────────────────────────── */
  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12">
        <div className="aspect-[3/4] rounded-3xl bg-gray-100" />
        <div className="space-y-5 pt-4">
          <div className="h-4 w-24 bg-gray-100 rounded" />
          <div className="h-8 w-3/4 bg-gray-100 rounded" />
          <div className="h-5 w-1/2 bg-gray-100 rounded" />
          <div className="h-24 bg-gray-100 rounded" />
          <div className="h-12 bg-gray-100 rounded-xl" />
          <div className="h-12 bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <FiAlertCircle size={48} className="text-gray-300" />
      <p className="text-gray-500 font-medium">Product not found</p>
      <Link to="/" className="text-yellow-600 font-bold hover:underline">← Back to Home</Link>
    </div>
  );

  /* ─── Render ──────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Breadcrumb ──────────────────────────────────────── */}
      <div className="bg-gray-50 border-b border-gray-100 py-3">
        <div className="max-w-7xl mx-auto px-4 text-xs text-gray-500 flex items-center gap-1.5 flex-wrap">
          <Link to="/" className="hover:text-yellow-600 transition">Home</Link>
          <FiChevronRight size={10} />
          <Link to="/categories" className="hover:text-yellow-600 transition">{product.category?.name || 'Store'}</Link>
          <FiChevronRight size={10} />
          <span className="text-gray-800 font-semibold truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">

        {/* ═══════════════════════════════════════════════════
            TOP SECTION: GALLERY + INFO
        ═══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 lg:gap-14">

          {/* ── LEFT: Image Gallery ──────────────────────── */}
          <div>
            <ImageGallery
              images={colorImages}
              selectedIdx={selectedImgIdx}
              onChange={setSelectedImgIdx}
            />
          </div>

          {/* ── RIGHT: Product Info ───────────────────────── */}
          <div ref={infoRef} className="space-y-5">

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {product.newArrival && <span className="px-2.5 py-1 text-[10px] font-black bg-emerald-500 text-white rounded-full uppercase tracking-widest">New Arrival</span>}
              {product.trending && <span className="px-2.5 py-1 text-[10px] font-black bg-orange-500 text-white rounded-full uppercase tracking-widest">🔥 Trending</span>}
              {product.bestSeller && <span className="px-2.5 py-1 text-[10px] font-black bg-purple-600 text-white rounded-full uppercase tracking-widest">🏆 Best Seller</span>}
              {product.featured && <span className="px-2.5 py-1 text-[10px] font-black bg-yellow-400 text-black rounded-full uppercase tracking-widest">⭐ Featured</span>}
              {currentStock > 0 && currentStock <= 5 && <span className="px-2.5 py-1 text-[10px] font-black bg-red-500 text-white rounded-full uppercase tracking-widest animate-pulse">Only {currentStock} left!</span>}
            </div>

            {/* Brand + Name */}
            <div>
              {product.brand && <p className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-1">{product.brand?.name || product.brand}</p>}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>
              <p className="text-xs text-gray-400 font-mono mt-1.5">SKU: {product.sku}</p>
            </div>

            {/* Rating row */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full">
                <Stars rating={reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 4.5} size={12} />
                <span className="text-xs font-bold text-amber-700">
                  {reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '4.5'}
                </span>
              </div>
              <button onClick={() => setActiveTab('reviews')} className="text-xs text-gray-500 hover:text-yellow-600 hover:underline transition">
                {reviews.length} reviews
              </button>
              <span className="text-xs text-emerald-600 font-semibold">
                {currentStock > 0 ? `✓ In Stock (${currentStock})` : '✗ Out of Stock'}
              </span>
            </div>

            {/* Price block */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-100 rounded-2xl px-5 py-4">
              <div className="flex items-end gap-3 flex-wrap">
                <span className="text-3xl font-black text-gray-900">{formatCurrency(currentDiscountPrice)}</span>
                {currentDiscount > 0 && (
                  <>
                    <span className="text-base text-gray-400 line-through pb-0.5">{formatCurrency(currentPrice)}</span>
                    <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-black rounded-full">-{currentDiscount}% OFF</span>
                  </>
                )}
              </div>
              {savedAmount > 0 && (
                <p className="text-sm text-emerald-600 font-bold mt-1">You save {formatCurrency(savedAmount)} 🎉</p>
              )}
              <p className="text-[10px] text-gray-400 mt-1">Inclusive of all taxes. Free delivery above ₹499.</p>
            </div>

            {/* Color Variants */}
            {colorVariants.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-bold text-gray-800">Color:</span>
                  <span className="text-sm font-bold text-yellow-700">{selectedColor.name || colorVariants[selectedColorIdx]?.name}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {colorVariants.map((c, i) => {
                    const outOfStock = parseInt(c.stock || 0) === 0;
                    return (
                      <button
                        key={i}
                        onClick={() => { if (!outOfStock) { setSelectedColorIdx(i); setSelectedSize(''); } }}
                        disabled={outOfStock}
                        title={`${c.name}${outOfStock ? ' (Out of Stock)' : ''}`}
                        className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-semibold transition
                          ${i === selectedColorIdx ? 'border-yellow-400 bg-yellow-50 shadow-md shadow-yellow-100' : 'border-gray-200 hover:border-gray-300'}
                          ${outOfStock ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span className="w-4 h-4 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: c.hex || '#ccc' }} />
                        <span className="text-gray-700">{c.name}</span>
                        {i === selectedColorIdx && <FiCheck size={11} className="text-yellow-600" />}
                        {outOfStock && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] px-1 rounded-full">OOS</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {availableSizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-800">Size: <span className="text-yellow-600">{selectedSize}</span></span>
                  <button onClick={() => setShowSizeGuide(true)} className="text-xs text-yellow-600 font-bold hover:underline flex items-center gap-1">
                    <FiInfo size={11} /> Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => {
                    // Check size stock in current color
                    const sizeData = selectedColor.sizes?.find(s => s.size === size);
                    const sizeStock = sizeData ? parseInt(sizeData.stock || 0) : 1;
                    const outOfStock = sizeData && sizeStock === 0;
                    return (
                      <button
                        key={size}
                        onClick={() => { if (!outOfStock) setSelectedSize(size); }}
                        disabled={outOfStock}
                        className={`relative min-w-[52px] px-3 py-2.5 rounded-xl text-sm font-bold border-2 transition
                          ${selectedSize === size ? 'border-yellow-400 bg-yellow-400 text-black shadow-md shadow-yellow-100' : 'border-gray-200 text-gray-700 hover:border-gray-300'}
                          ${outOfStock ? 'opacity-35 cursor-not-allowed line-through' : ''}`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity + Cart actions */}
            {currentStock > 0 ? (
              <div className="space-y-3">
                {/* Qty selector */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="px-4 py-3 text-gray-600 hover:bg-gray-100 transition">
                      <FiMinus size={14} />
                    </button>
                    <span className="px-5 py-3 font-black text-gray-900 min-w-[48px] text-center text-sm">{quantity}</span>
                    <button onClick={() => setQuantity(q => Math.min(currentStock, q + 1))}
                      className="px-4 py-3 text-gray-600 hover:bg-gray-100 transition">
                      <FiPlus size={14} />
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">{currentStock} available</span>
                </div>

                {/* CTA Buttons */}
                <div className="grid grid-cols-1 gap-3">
                  <button onClick={handleAddToCart}
                    className="w-full py-4 rounded-2xl border-2 border-yellow-400 bg-yellow-50 text-yellow-800 font-black text-sm hover:bg-yellow-400 hover:text-black transition flex items-center justify-center gap-2 shadow-sm">
                    <FiShoppingBag size={16} /> Add to Cart
                  </button>
                  <button onClick={handleBuyNow}
                    className="w-full py-4 rounded-2xl bg-gray-900 text-white font-black text-sm hover:bg-gray-800 transition flex items-center justify-center gap-2 shadow-lg">
                    ⚡ Buy Now
                  </button>
                </div>

                {/* Secondary actions */}
                <div className="flex gap-3">
                  <button onClick={handleWishlist}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition
                      ${isWishlisted ? 'border-red-300 bg-red-50 text-red-600' : 'border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-500'}`}>
                    <FiHeart size={14} className={isWishlisted ? 'fill-current' : ''} />
                    {isWishlisted ? 'Wishlisted' : 'Wishlist'}
                  </button>
                  <button onClick={() => setShowShare(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:border-gray-300 transition">
                    <FiShare2 size={14} /> Share
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 text-center">
                  <p className="font-bold text-red-600">Currently Out of Stock</p>
                  <p className="text-xs text-gray-500 mt-1">We'll notify you when this is back</p>
                </div>
                <button onClick={() => toast.info('Notified! We\'ll email you when restocked.')}
                  className="w-full py-4 rounded-2xl bg-gray-900 text-yellow-400 font-black text-sm hover:bg-gray-800 transition flex items-center justify-center gap-2">
                  <FiBell size={15} /> Notify When Restocked
                </button>
              </div>
            )}

            {/* Delivery Pincode */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <FiMapPin size={14} className="text-yellow-500" /> Check Delivery
              </p>
              <form onSubmit={handlePincode} className="flex gap-2">
                <input
                  type="text" maxLength={6} value={pincode} onChange={e => setPincode(e.target.value)}
                  placeholder="Enter PIN code" inputMode="numeric"
                  className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                />
                <button type="submit" className="px-4 py-2.5 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition">
                  Check
                </button>
              </form>
              {deliveryInfo && (
                <div className="text-xs space-y-1.5 pt-1">
                  <p className="text-emerald-600 font-bold">✓ Delivery by {deliveryInfo.date}</p>
                  <p className={`font-medium ${deliveryInfo.free ? 'text-emerald-600' : 'text-gray-600'}`}>
                    {deliveryInfo.free ? '✓ Free Delivery' : '₹49 Shipping charges'}
                  </p>
                  {deliveryInfo.cod && <p className="text-gray-600">✓ Cash on Delivery available</p>}
                </div>
              )}
            </div>

            {/* Trust badges */}
            <TrustBadges />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            TABS: Description / Specs / Reviews
        ═══════════════════════════════════════════════════ */}
        <div className="mt-16">
          {/* Tab nav */}
          <div className="flex gap-0 border-b border-gray-200 overflow-x-auto scrollbar-none">
            {[
              { id: 'description', label: 'Description' },
              { id: 'specs', label: 'Specifications' },
              { id: 'reviews', label: `Reviews (${reviews.length})` },
              { id: 'shipping', label: 'Shipping & Returns' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 pb-3 pt-1 px-5 text-sm font-bold border-b-2 transition
                  ${activeTab === tab.id ? 'border-yellow-400 text-yellow-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >

                {/* Description tab */}
                {activeTab === 'description' && (
                  <div className="space-y-6 max-w-3xl">
                    {product.shortDesc && (
                      <p className="text-base text-gray-600 font-medium leading-relaxed">{product.shortDesc}</p>
                    )}
                    {product.description && (
                      <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                        {product.description}
                      </div>
                    )}
                    {/* Key highlights */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Material', value: product.material },
                        { label: 'Occasion', value: product.occasion },
                        { label: 'Gender', value: product.gender },
                        { label: 'Wash Care', value: product.washCare },
                      ].filter(f => f.value).map(f => (
                        <div key={f.label} className="bg-gray-50 rounded-xl px-4 py-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{f.label}</p>
                          <p className="text-sm font-semibold text-gray-800 mt-0.5">{f.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specifications tab */}
                {activeTab === 'specs' && (
                  <div className="max-w-2xl overflow-hidden rounded-2xl border border-gray-200">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-gray-100">
                        {[
                          { label: 'Brand', value: product.brand?.name || product.brand },
                          { label: 'Material', value: product.material },
                          { label: 'Fabric', value: product.fabric },
                          { label: 'Pattern', value: product.pattern },
                          { label: 'Fit', value: product.fit },
                          { label: 'Sleeve', value: product.sleeve },
                          { label: 'Neck Type', value: product.neck },
                          { label: 'Occasion', value: product.occasion },
                          { label: 'Gender', value: product.gender },
                          { label: 'Available Sizes', value: availableSizes.join(', ') },
                          { label: 'SKU', value: product.sku },
                          { label: 'Category', value: product.category?.name },
                          { label: 'Subcategory', value: product.subCategory?.name },
                          { label: 'Country of Origin', value: product.countryOfOrigin || 'India' },
                          { label: 'Wash Care', value: product.washCare },
                          { label: 'Warranty', value: product.warranty },
                        ].filter(r => r.value).map((row, i) => (
                          <tr key={row.label} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-5 py-3 font-semibold text-gray-500 w-40">{row.label}</td>
                            <td className="px-5 py-3 text-gray-800">{row.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Reviews tab */}
                {activeTab === 'reviews' && (
                  <div className="space-y-6 max-w-3xl">
                    <RatingBreakdown reviews={reviews} />

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex gap-2">
                        {['newest', 'highest', 'lowest'].map(s => (
                          <button key={s} onClick={() => setReviewSort(s)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition
                              ${reviewSort === s ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => setShowReviewForm(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition">
                        <FiMessageSquare size={12} /> Write a Review
                      </button>
                    </div>

                    {sortedReviews.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-2xl">
                        <FiStar size={36} className="mx-auto text-gray-200 mb-2" />
                        <p className="text-gray-400 font-medium">No reviews yet</p>
                        <p className="text-sm text-gray-400">Be the first to review this product!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sortedReviews.map(r => <ReviewCard key={r.id} review={r} />)}
                      </div>
                    )}
                  </div>
                )}

                {/* Shipping tab */}
                {activeTab === 'shipping' && (
                  <div className="max-w-2xl space-y-4">
                    {[
                      { icon: FiTruck, title: 'Free Delivery', desc: 'On orders above ₹499. Estimated 3-5 business days.' },
                      { icon: FiRefreshCw, title: '7-Day Returns', desc: 'Hassle-free returns within 7 days of delivery. Item must be unused and in original packaging.' },
                      { icon: FiShield, title: 'Secure Payment', desc: 'All payments are SSL-encrypted. We support UPI, Cards, Net Banking, and Cash on Delivery.' },
                      { icon: FiPackage, title: 'Quality Guaranteed', desc: 'All products are quality-checked before dispatch. 100% authentic products.' },
                    ].map(item => (
                      <div key={item.title} className="flex gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
                          <item.icon size={18} className="text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            RELATED PRODUCTS
        ═══════════════════════════════════════════════════ */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 border-t border-gray-100 pt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">You May Also Like</h2>
              <Link to="/categories" className="text-sm text-yellow-600 font-bold hover:underline flex items-center gap-1">
                View All <FiChevronRight size={14} />
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
              {relatedProducts.map(p => <MiniProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            RECENTLY VIEWED
        ═══════════════════════════════════════════════════ */}
        <RecentlyViewedSection currentId={product.id} />

      </div>

      {/* ═══════════════════════════════════════════════════
          STICKY PRODUCT BAR (appears on scroll)
      ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {stickyVisible && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 shadow-2xl px-4 py-3"
          >
            <div className="max-w-7xl mx-auto flex items-center gap-4">
              <img src={colorImages[0]?.url || colorImages[0]} alt="" className="w-12 h-14 object-cover rounded-xl bg-gray-100 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">{product.name}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {selectedColor.name && <span>{selectedColor.name}</span>}
                  {selectedSize && <><span>·</span><span>Size: {selectedSize}</span></>}
                </div>
              </div>
              <div className="flex-shrink-0">
                <p className="font-black text-gray-900 text-lg">{formatCurrency(currentDiscountPrice)}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={handleAddToCart}
                  className="px-4 py-2.5 rounded-xl border-2 border-yellow-400 bg-yellow-50 text-yellow-800 text-xs font-black hover:bg-yellow-400 hover:text-black transition whitespace-nowrap">
                  + Cart
                </button>
                <button onClick={handleBuyNow}
                  className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-black hover:bg-gray-800 transition whitespace-nowrap">
                  Buy Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════
          SHARE MODAL
      ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showShare && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center px-4"
            onClick={() => setShowShare(false)}>
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} exit={{ y: 50 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900">Share Product</h3>
                <button onClick={() => setShowShare(false)} className="p-2 rounded-xl hover:bg-gray-100 transition"><FiX size={16}/></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'WhatsApp', icon: FaWhatsapp, color: 'bg-green-500', url: `https://wa.me/?text=${encodeURIComponent(product.name + ' - ' + shareUrl)}` },
                  { label: 'Facebook', icon: FaFacebook, color: 'bg-blue-600', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
                  { label: 'Telegram', icon: FaTelegram, color: 'bg-sky-500', url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}` },
                  { label: 'Twitter', icon: FaTwitter, color: 'bg-gray-900', url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(product.name)}` },
                ].map(s => (
                  <a key={s.label} href={s.url} target="_blank" rel="noreferrer"
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${s.color} text-white font-bold text-sm transition hover:opacity-90`}>
                    <s.icon size={18} /> {s.label}
                  </a>
                ))}
              </div>
              <button onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success('Link copied!'); setShowShare(false); }}
                className="mt-3 w-full py-3 rounded-2xl border-2 border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition">
                📋 Copy Link
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════
          SIZE GUIDE MODAL
      ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showSizeGuide && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center px-4"
            onClick={() => setShowSizeGuide(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900 text-lg">Size Guide</h3>
                <button onClick={() => setShowSizeGuide(false)} className="p-2 rounded-xl hover:bg-gray-100 transition"><FiX size={16}/></button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-center">
                  <thead className="bg-gray-900 text-white">
                    <tr>{['Size', 'Chest (in)', 'Waist (in)', 'Hip (in)', 'Length (in)'].map(h => <th key={h} className="px-3 py-2 font-semibold text-xs">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[['XS','32-34','26-28','34-36','25'],['S','34-36','28-30','36-38','25.5'],['M','36-38','30-32','38-40','26'],['L','38-40','32-34','40-42','26.5'],['XL','40-42','34-36','42-44','27'],['XXL','42-44','36-38','44-46','27.5'],['3XL','44-46','38-40','46-48','28']].map(row => (
                      <tr key={row[0]} className="even:bg-gray-50">
                        {row.map((cell, i) => (
                          <td key={i} className={`px-3 py-2 ${i === 0 ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-4 text-center">Measurements are in inches. For best fit, measure your body and refer to this chart.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════
          REVIEW FORM MODAL
      ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showReviewForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center px-4"
            onClick={() => setShowReviewForm(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900 text-lg">Write a Review</h3>
                <button onClick={() => setShowReviewForm(false)} className="p-2 rounded-xl hover:bg-gray-100 transition"><FiX size={16}/></button>
              </div>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Your Rating</label>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button" onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                        className="p-1 rounded-lg hover:scale-110 transition">
                        <FiStar size={24} className={n <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Review Title</label>
                  <input type="text" value={reviewForm.title} onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Absolutely love it!" required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Review</label>
                  <textarea rows={4} value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                    placeholder="Share your experience with this product..." required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowReviewForm(false)}
                    className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 py-3 rounded-2xl bg-yellow-400 text-black text-sm font-black hover:bg-yellow-300 transition">
                    Post Review
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   RECENTLY VIEWED SECTION
═══════════════════════════════════════════════════════════════ */
const RecentlyViewedSection = ({ currentId }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  useEffect(() => {
    try {
      const saved = safeJSON(localStorage.getItem('styleverse_recently_viewed'));
      setItems(saved.filter(p => p.id !== currentId).slice(0, 6));
    } catch {}
  }, [currentId]);
  if (items.length === 0) return null;
  return (
    <div className="mt-12 border-t border-gray-100 pt-10">
      <h3 className="text-lg font-black text-gray-900 mb-5">Recently Viewed</h3>
      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none">
        {items.map(item => (
          <button key={item.id} onClick={() => navigate(`/product/${item.slug}`)}
            className="flex-shrink-0 w-32 text-left group">
            <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 mb-2">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300 text-2xl">👔</div>
              )}
            </div>
            <p className="text-xs font-bold text-gray-700 truncate">{item.name}</p>
            <p className="text-xs font-black text-gray-900 mt-0.5">{formatCurrency(item.price)}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductDetails;
