import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PropertyCard from '../PropertyCard/PropertyCard';
import styles from './PropertyGrid.module.css';
import { useTranslation } from 'react-i18next';
import { fetchProperties } from '../../services/api';
import type { Property } from '../../types/Property';

interface PropertyGridProps {
  layoutType?: 'single-column' | 'multi-column';
  animationType?: 'vertical' | 'horizontal';
  showTitle?: boolean;
  properties?: Property[];
}

const PropertyGrid: React.FC<PropertyGridProps> = ({
  layoutType = 'single-column',
  animationType = 'vertical',
  showTitle = true,
  properties
}) => {
  const { t } = useTranslation();
  const [data, setData] = useState<Property[]>([]);

  useEffect(() => {
    if (!properties) {
      fetchProperties().then(setData).catch(console.error);
    }
  }, [properties]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const list = properties ?? data;

  return (
    <section id="featured-properties" className={`${styles.propertyGridSection} ${layoutType === 'multi-column' ? styles.multiColumnLayout : ''}`}>
      <div className={styles.container}>
        {showTitle && <h2 className={styles.sectionTitle}>{t('featured_properties')}</h2>}
        <motion.div
          className={styles.grid}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {list.map((property, index) => (
            <PropertyCard key={property.id} property={property} index={index} animationType={animationType} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PropertyGrid;
