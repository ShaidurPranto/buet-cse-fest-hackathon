import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import OrderPage from './OrderPage.jsx'
import './index.css'

// Render based on URL path or environment variable
const isOrderPage = window.location.pathname === '/order' || import.meta.env.VITE_PAGE === 'order'
const Component = isOrderPage ? OrderPage : App

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Component />
    </React.StrictMode>,
)

