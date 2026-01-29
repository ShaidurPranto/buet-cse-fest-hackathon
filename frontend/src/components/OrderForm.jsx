import React, { useState, useEffect } from 'react';
import { Send, CheckCircle, AlertCircle, Clock, ShoppingCart, Loader, Package, User, X } from 'lucide-react';
import { fetchProducts, createOrder } from '../services/api.js';

const OrderForm = () => {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [userId, setUserId] = useState('201');
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingOrder, setLoadingOrder] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [isError, setIsError] = useState(false);

    // Load products on component mount
    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoadingProducts(true);
        try {
            const data = await fetchProducts();
            setProducts(data);
            if (data.length > 0) {
                setSelectedProduct(data[0].id);
            }
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoadingProducts(false);
        }
    };

    const placeOrder = async () => {
        if (!selectedProduct) {
            alert('Please select a product');
            return;
        }

        if (!userId.trim()) {
            alert('Please enter a valid User ID');
            return;
        }

        setLoadingOrder(true);
        setShowModal(false);

        try {
            const response = await createOrder(selectedProduct, parseInt(quantity, 10), parseInt(userId, 10));

            // Show success modal
            setModalData({
                title: '✓ Order Confirmed',
                type: 'success',
                details: {
                    'Order ID': `#${response.order.id}`,
                    'Product ID': response.order.product_id,
                    'Quantity': response.order.quantity,
                    'User ID': response.order.user_id,
                    'Status': response.order.order_status || 'PENDING'
                },
                message: 'Your order has been placed successfully!'
            });
            setIsError(false);
            setShowModal(true);

            // Reset form
            setQuantity(1);
            setSelectedProduct(products[0]?.id || null);

        } catch (error) {
            // Show error modal
            setModalData({
                title: '✗ Order Failed',
                type: 'error',
                details: {
                    'Product ID': selectedProduct,
                    'Quantity': quantity,
                    'User ID': userId
                },
                message: error.message || 'Failed to place order. Please try again.'
            });
            setIsError(true);
            setShowModal(true);
        } finally {
            setLoadingOrder(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setModalData(null);
    };

    const selectedProductData = products.find(p => p.id === selectedProduct);

    return (
        <>
            {/* Confirmation Modal */}
            {showModal && modalData && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className={`modal-header ${isError ? 'error' : 'success'}`}>
                            <div className="modal-title-wrapper">
                                {isError ? (
                                    <AlertCircle size={32} className="modal-icon error" />
                                ) : (
                                    <CheckCircle size={32} className="modal-icon success" />
                                )}
                                <h2>{modalData.title}</h2>
                            </div>
                            <button className="modal-close" onClick={closeModal}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <p className="modal-message">{modalData.message}</p>

                            {modalData.details && (
                                <div className="modal-details">
                                    {Object.entries(modalData.details).map(([key, value]) => (
                                        <div key={key} className="detail-row">
                                            <span className="detail-label">{key}:</span>
                                            <span className="detail-value">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button
                                className={`modal-button ${isError ? 'error-btn' : 'success-btn'}`}
                                onClick={closeModal}
                            >
                                {isError ? 'Try Again' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="order-form-container">
                <div className="order-card">
                    <h1>
                        <ShoppingCart size={32} className="header-icon" />
                        Place Your Order
                    </h1>
                    <p className="subtitle">Select Product and Place Order</p>

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
                                {products.map((product) => (
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
                                    </div>
                                ))}
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
                                <span className="detail-label">Product ID:</span>
                                <strong className="detail-value">#{selectedProductData.id}</strong>
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
                                        disabled={loadingOrder}
                                    />
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        disabled={loadingOrder}
                                        className="qty-btn"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={placeOrder}
                                disabled={loadingOrder || !selectedProduct || !userId.trim()}
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
                </div>
            </div>
        </>
    );
};

export default OrderForm;

