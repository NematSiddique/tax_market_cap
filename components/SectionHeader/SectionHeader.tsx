import styles from './SectionHeader.module.css';

const SectionHeader = ({ title, description }: { title: string; description: string }) => {
  return (
    <div className={styles.sectionHeader}>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
};

export default SectionHeader;