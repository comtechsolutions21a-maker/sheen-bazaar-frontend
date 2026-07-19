import { useCart } from '../context/CartContext';

export default function Toast() {
  const { toast } = useCart();
  return <div className={`toast${toast ? ' show' : ''}`}>{toast}</div>;
}
