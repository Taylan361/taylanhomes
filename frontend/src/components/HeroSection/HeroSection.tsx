// frontend/src/components/HeroSection/HeroSection.tsx
import React from 'react';
import { motion } from 'framer-motion';
import styles from './HeroSection.module.css';
import { useTranslation } from 'react-i18next';
import ImageSlider from '../ImageSlider/ImageSlider'; // <-- ImageSlider'ı import et!

// Arka plan resimlerini import et
import image7 from '../../assets/images/homepage-banner.jpg'; // 7.png
import image8 from '../../assets/images/homepage-banner-2.jpg'; // 8.png

interface HeroSectionProps {
  onExploreClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onExploreClick }) => {
  const { t } = useTranslation();

  // Kaydırıcıya verilecek resim dizisi
  const sliderImages = [
    image7,
    image8,
   
   
  ];

   // Animasyon varyantları
  const textVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const
      }
    }
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        delay: 0.5,
        ease: "easeOut" as const
      }
    }
  };


  return (
    <section className={styles.hero}>
      {/* ImageSlider bileşenini buraya ekledik */}
      <ImageSlider images={sliderImages} />

      <div className={styles.overlay}></div> {/* Görselin üzerine hafif karartma */}
      <div className={styles.content}>
        <motion.h1
          className={styles.title}
          variants={textVariants}
          initial="hidden"
          animate="visible"
        >
          {t('find_your_dream_home')}
        </motion.h1>
        <motion.p
          className={styles.description}
          variants={textVariants}
          initial="hidden"
          animate="visible"
          transition={{ ...textVariants.visible.transition, delay: 0.3 }}
        >
          {t('')}
        </motion.p>
        <motion.button
          className={`${styles.button} btn-primary`}
          variants={buttonVariants}
          initial="hidden"
          animate="visible"
          onClick={onExploreClick}
        >
          {t('explore_all_properties')}
        </motion.button>
      </div>
    </section>
  );
};

export default HeroSection;
