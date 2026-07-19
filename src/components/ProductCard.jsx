import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart, showToast } = useCart();

  async function handleAdd() {
    const ok = await addToCart(product.id, 1);
    if (ok) showToast('Added to cart 🛒');
  }

  return (
    <div className="card">
      <Link to={`/products/${product.id}`}>
        <div className="imgbox">
          <span className="badge">{product.badge}</span>
          {product.image ? <img src={product.image} alt={product.name} /> : product.icon}
        </div>
      </Link>
      <div className="info">
        <Link to={`/products/${product.id}`}>
          <div className="name">{product.name}</div>
        </Link>
        <div className="rating">★ {product.rating}</div>
        <div className="price-row">
          <span className="price-big">₹{product.price}</span>
          <span className="price-old">₹{product.old}</span>
        </div>
        <div className="free-del">Free delivery</div>
        <button className="add-btn" onClick={handleAdd}>Add to Cart</button>
      </div>
    </div>
  );
}
