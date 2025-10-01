import { useLocation } from '@umijs/max';
import styles from './index.scss';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const location_ref = useLocation();
  return location_ref.pathname == '/lama' ? null : (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        background: '#171717',
        padding: 24,
      }}
      className={styles.footer}
//      onClick={() => {
//        window.open('https://blue-light.co.jp/');
//      }}
    >
      <span
        style={{ cursor: 'pointer' }}
      >{`©Copyright ${currentYear} Blue light Co.,Ltd.`}</span>
    </div>
  );
};

export default Footer;
