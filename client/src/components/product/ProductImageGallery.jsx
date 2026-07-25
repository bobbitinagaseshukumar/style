import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

const ProductImageGallery = ({ images }) => {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-400">No Image Available</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4 h-full">
      {/* Thumbnails */}
      <div className="w-full md:w-24 h-24 md:h-auto">
        <Swiper
          onSwiper={setThumbsSwiper}
          direction={window.innerWidth >= 768 ? 'vertical' : 'horizontal'}
          spaceBetween={10}
          slidesPerView={4}
          freeMode={true}
          watchSlidesProgress={true}
          modules={[FreeMode, Navigation, Thumbs]}
          className="h-full w-full custom-thumbs-swiper"
        >
          {images.map((img, index) => (
            <SwiperSlide key={index} className="cursor-pointer rounded-md overflow-hidden opacity-60 hover:opacity-100 transition-opacity border border-transparent [&.swiper-slide-thumb-active]:border-gold-500 [&.swiper-slide-thumb-active]:opacity-100">
              <img src={img.url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Main Image */}
      <div className="flex-1 w-full bg-gray-50 rounded-lg overflow-hidden group">
        <Swiper
          spaceBetween={10}
          navigation={true}
          thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
          modules={[FreeMode, Navigation, Thumbs]}
          className="h-full w-full"
        >
          {images.map((img, index) => (
            <SwiperSlide key={index}>
              <div className="w-full h-full relative cursor-crosshair overflow-hidden">
                <img 
                  src={img.url} 
                  alt={`Product view ${index + 1}`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default ProductImageGallery;
