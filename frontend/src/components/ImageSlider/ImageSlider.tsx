// frontend/src/components/ImageSlider/ImageSlider.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ImageSlider.module.css';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'; // Ok ikonları için

interface ImageSliderProps {
  images: string[]; // Resim yollarının dizisi
  interval?: number; // Otomatik geçiş süresi (ms cinsinden)
}

const ImageSlider: React.FC<ImageSliderProps> = ({ images, interval = 5000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Otomatik geçiş efekti
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, interval);
    return () => clearInterval(timer); // Bileşen kaldırıldığında temizle
  }, [images.length, interval]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  // Animasyon varyantları
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000, // Sağdan veya soldan giriş
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000, // Sağdan veya soldan çıkış
      opacity: 0,
    }),
  };

  // Yönü belirlemek için state (ileri/geri)
  const [direction, setDirection] = useState(0); // 0: yok, 1: ileri, -1: geri

  const handleNext = () => {
    setDirection(1);
    goToNext();
  };

  const handlePrevious = () => {
    setDirection(-1);
    goToPrevious();
  };

  return (
    <div className={styles.sliderContainer}>
      <AnimatePresence initial={false} custom={direction}>
        <motion.img
          key={currentIndex} // Resim değiştiğinde animasyonu tetikle
          src={images[currentIndex]}
          alt={`Slider Image ${currentIndex + 1}`}
          className={styles.sliderImage}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
        />
      </AnimatePresence>

      <button onClick={handlePrevious} className={`${styles.navButton} ${styles.prevButton}`}>
        <FaChevronLeft />
      </button>
      <button onClick={handleNext} className={`${styles.navButton} ${styles.nextButton}`}>
        <FaChevronRight />
      </button>

      <div className={styles.dotsContainer}>
        {images.map((_, index) => (
          <div
            key={index}
            className={`${styles.dot} ${index === currentIndex ? styles.activeDot : ''}`}
            onClick={() => setCurrentIndex(index)}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default ImageSlider;
