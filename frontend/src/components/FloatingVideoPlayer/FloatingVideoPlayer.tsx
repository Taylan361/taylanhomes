// frontend/src/components/FloatingVideoPlayer/FloatingVideoPlayer.tsx
import React, { useRef, useState, useEffect } from 'react';
import styles from './FloatingVideoPlayer.module.css';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

// Video dosyanızı buraya import edin.
// Lütfen videonuzu `frontend/src/assets/videos/` klasörüne koyun ve adını `emlak-tanitim.mp4` olarak güncelleyin.
import propertyVideo from '../../assets/videos/emlak-tanitim.mp4'; // <-- VİDEO YOLU BURADA GÜNCELLENDİ

const FloatingVideoPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true); // Başlangıçta oynatılıyor
  const [isMuted, setIsMuted] = useState(true);   // Başlangıçta sessiz

  // Bileşen yüklendiğinde videoyu otomatik oynat ve sessize al
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => console.log("Video autoplay failed:", error));
      videoRef.current.muted = true;
    }
  }, []);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className={styles.videoContainer}>
      <div className={styles.videoTitle}>Bektaş Villa Project</div> {/* Video Başlığı */}
      <video
        ref={videoRef}
        className={styles.videoPlayer}
        loop // Otomatik tekrar oynat
        muted={isMuted} // Başlangıçta sessiz
        autoPlay // Otomatik oynat
        playsInline // Mobil cihazlarda tam ekran olmadan oynatmayı dener
      >
        <source src={propertyVideo} type="video/mp4" /> {/* İMPOrt edilen değişkeni kullanın */}
        Tarayıcınız video etiketini desteklemiyor.
      </video>
      <div className={styles.controls}>
        <button onClick={togglePlayPause} className={styles.controlButton}>
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
        <button onClick={toggleMute} className={styles.controlButton}>
          {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>
      </div>
    </div>
  );
};

export default FloatingVideoPlayer;
