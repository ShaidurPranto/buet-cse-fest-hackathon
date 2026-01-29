import React, { useState, useEffect } from 'react';
import { Send, CheckCircle, AlertCircle, Clock, ShoppingCart, Loader, Package, User } from 'lucide-react';

// Dummy products data
const DUMMY_PRODUCTS = [
    { id: 1, name: 'Gaming Console', price: 499.99, stock: 15 },
    { id: 2, name: 'Wireless Headphones', price: 149.99, stock: 32 },
    { id: 3, name: 'Smart Watch', price: 299.99, stock: 8 },
    { id: 4, name: 'USB-C Cable', price: 19.99, stock: 100 },
    { id: 5, name: 'Laptop Stand', price: 79.99, stock: 5 },
    { id: 6, name: 'Mechanical Keyboard', price: 179.99, stock: 22 },
    { id: 7, name: '4K Monitor', price: 599.99, stock: 3 },
    { id: 8, name: 'Mouse Pad', price: 29.99, stock: 50 }
];

const OrderForm = () => {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [userId, setUserId] = useState('1');
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingOrder, setLoadingOrder] = useState(false);
    const [result, setResult] = useState(null);

    // Load dummy products on component mount
    useEffect(() => {
        // Simulate network delay
        setTimeout(() => {
            setProducts(DUMMY_PRODUCTS);
            setSelectedProduct(DUMMY_PRODUCTS[0].id);
            setLoadingProducts(false);
        }, 500);
    }, []);

    const placeOrder = async () => {
        if (!selectedProduct) {
            setResult({
                type: 'error',
                message: 'Please select a product'
            });
            return;
        }

        if (!userId.trim()) {
            setResult({
                type: 'error',
                message: 'Please enter a valid User ID'
            });
            return;
        }

        setLoadingOrder(true);
        setResult(null);

        try {
            const response = await fetch('http://localhost:8080/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_id: selectedProduct,
                    quantity: parseInt(quantity, 10),
                    user_id: parseInt(userId, 10)
                })
            });

            const data = await response.json();

            if (response.ok) {
                setResult({
                    type: 'success',
                    orderId: data.orderId || data.id,
                    status: data.order_status || data.status,
                    message: `Order #${data.orderId || data.id} placed successfully!`
                });
                setQuantity(1);
                setSelectedProduct(products[0]?.id || null);
            } else {
                setResult({
                    type: 'error',
                    message: data.message || response.statusText,
                    statusCode: response.status
                });
            }
        } catch (err) {
            setResult({
                type: 'timeout',
                message: 'Request failed – Order Service timeout or unreachable'
            });
        } finally {
            setLoadingOrder(false);
        }
    };

    const selectedProductData = products.find(p => p.id === selectedProduct);
    const getStockStatus = (stock) => {
        if (stock <= 3) return { label: 'Low Stock', color: '#ef4444' };
        if (stock <= 10) return { label: 'Limited', color: '#f59e0b' };
        return { label: 'In Stock', color: '#22c55e' };
    };

    return (
        <div className="order-form-container">
            <div className="order-card">
                <h1>
                    <ShoppingCart size={32} className="header-icon" />
                    Place Your Order
                </h1>
                <p className="subtitle">Valerix E-Commerce Platform</p>

                {/* Products Section */}
                <div className="products-section">
                    <div className="section-header">
                        <h2>Available Products</h2>
                        <span className="product-count">{products.length} items</span>
                    </div>

                    {loadingProducts ? (
                        <div className="loading">
                            <Loader size={24} className="icon-spin" />
                            Loading products...
                        </div>
                    ) : products.length > 0 ? (
                        <div className="products-grid">
                            {products.map((product) => {
                                const stockStatus = getStockStatus(product.stock);
                                return (
                                    <div
                                        key={product.id}
                                        className={`product-card ${selectedProduct === product.id ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedProduct(product.id);
                                            setQuantity(1);
                                        }}
                                    >
                                        <div className="product-icon">
                                            <Package size={24} />
                                        </div>
                                        <div className="product-name">{product.name}</div>
                                        <div className="product-price">${product.price.toFixed(2)}</div>
                                        <div className="product-stock" style={{ color: stockStatus.color }}>
                                            {stockStatus.label}
                                        </div>
                                        <div className="stock-count">{product.stock} available</div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="no-products">No products available</div>
                    )}
                </div>

                {/* Order Details Section */}
                {selectedProductData && (
                    <div className="order-details">
                        <div className="detail-header">
                            <h3>Order Summary</h3>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Product:</span>
                            <strong className="detail-value">{selectedProductData.name}</strong>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Unit Price:</span>
                            <strong className="detail-value">${selectedProductData.price.toFixed(2)}</strong>
                        </div>

                        <div className="form-group">
                            <label>
                                <User size={16} className="label-icon" />
                                User ID
                            </label>
                            <input
                                type="text"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                disabled={loadingOrder}
                                placeholder="Enter your user ID"
                            />
                        </div>

                        <div className="form-group">
                            <label>Quantity</label>
                            <div className="quantity-input-group">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    disabled={loadingOrder || quantity <= 1}
                                    className="qty-btn"
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        if (!isNaN(val) && val > 0) setQuantity(val);
                                    }}
                                    min="1"
                                    max={selectedProductData.stock}
                                    disabled={loadingOrder}
                                />
                                <button
                                    onClick={() => setQuantity(Math.min(selectedProductData.stock, quantity + 1))}
                                    disabled={loadingOrder || quantity >= selectedProductData.stock}
                                    className="qty-btn"
                                >
                                    +
                                </button>
                            </div>
                            <small className="qty-hint">Max: {selectedProductData.stock} units</small>
                        </div>

                        <div className="detail-row total-row">
                            <span className="detail-label">Total:</span>
                            <strong className="detail-value total-price">
                                ${(selectedProductData.price * quantity).toFixed(2)}
                            </strong>
                        </div>

                        <button
                            onClick={placeOrder}
                            disabled={loadingOrder || !selectedProduct || quantity > selectedProductData.stock || !userId.trim()}
                            className="submit-btn"
                        >
                            {loadingOrder ? (
                                <>
                                    <Clock size={18} className="icon-spin" />
                                    Processing Order...
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Place Order
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Result Display */}
                {result && (
                    <div className={`result result-${result.type}`}>
                        {result.type === 'success' && (
                            <>
                                <CheckCircle size={24} />
                                <div className="result-content">
                                    <strong>✓ Order Successful</strong>
                                    <p>Order ID: <code>{result.orderId}</code></p>
                                    <p>Status: <strong>{result.status}</strong></p>
                                    <p className="success-message">Your order has been confirmed and inventory has been updated.</p>
                                </div>
                            </>
                        )}

                        {result.type === 'error' && (
                            <>
                                <AlertCircle size={24} />
                                <div className="result-content">
                                    <strong>✗ Order Failed</strong>
                                    <p>{result.message}</p>
                                    {result.statusCode && (
                                        <p className="error-code">HTTP {result.statusCode}</p>
                                    )}
                                </div>
                            </>
                        )}

                        {result.type === 'timeout' && (
                            <>
                                <AlertCircle size={24} />
                                <div className="result-content">
                                    <strong>⏱ Request Timeout</strong>
                                    <p>{result.message}</p>
                                    <p className="timeout-hint">
                                        This indicates the Order Service or Inventory Service is either slow or unreachable.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderForm;


