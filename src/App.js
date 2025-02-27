import React, { useEffect, useState } from "react";
import "./App.css";
import VisualData from "./VisualData";
import Inventory from "./Inventory";

const App = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOption, setMenuOption] = useState("All Orders");
  const [dateFilter, setDateFilter] = useState("Today");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`https://alcohal-server.gofastapi.com/getOrders`);
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        const data = await response.json();

        const sortedOrders = data.orders.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setOrders(sortedOrders);
        setError("");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    const intervalId = setInterval(fetchOrders, 10000);
    return () => clearInterval(intervalId);
  }, [menuOption]); // Fetch orders when menuOption changes

  const filterOrdersByDate = () => {
    const now = new Date();
    let filteredOrders = orders;

    if (dateFilter === "Today") {
      filteredOrders = orders.filter(
        (order) =>
          new Date(order.createdAt).toDateString() === now.toDateString()
      );
    } else if (dateFilter === "Last 3 Days") {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(now.getDate() - 3);
      filteredOrders = orders.filter(
        (order) => new Date(order.createdAt) >= threeDaysAgo
      );
    } else if (dateFilter === "Last 15 Days") {
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(now.getDate() - 15);
      filteredOrders = orders.filter(
        (order) => new Date(order.createdAt) >= fifteenDaysAgo
      );
    } else if (dateFilter === "Last Month") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      filteredOrders = orders.filter(
        (order) => new Date(order.createdAt) >= oneMonthAgo
      );
    }

    return filteredOrders;
  };

  const handleMarkAsShipped = async (orderId) => {
    try {
      const response = await fetch(`https://alcohal-server.gofastapi.com/markAsShipped`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });
      const data = await response.json();
      if (response.ok) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === orderId ? { ...order, isShipped: true } : order
          )
        );
      } else {
        throw new Error(data.error || "Error marking order as shipped");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const renderOrders = () => {
    const filteredOrders = filterOrdersByDate();

    const ordersToRender =
      menuOption === "Pending Orders"
        ? filteredOrders.filter((order) => !order.isShipped)
        : filteredOrders;

    return (
      <div className="order-table-container">
        <table className="order-table">
          <thead>
            <tr>
              <th>Dish</th>
              <th>Quantity</th>
              <th>Time</th>
              <th>Date</th>
              <th>Name</th>
              <th>Address</th>
              <th>Phone</th>
              <th>Zip Code</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {ordersToRender.map((order) => {
              const date = new Date(order.createdAt);
              return (
                <React.Fragment key={order._id}>
                  {order.cart.map((item, idx) => (
                    <tr key={`${order._id}-${idx}`}>
                      <td>{item.name}</td>
                      <td>{item.cartQuantity}</td>
                      {idx === 0 && (
                        <>
                          <td rowSpan={order.cart.length}>{date.toLocaleTimeString()}</td>
                          <td rowSpan={order.cart.length}>{date.toLocaleDateString()}</td>
                          <td rowSpan={order.cart.length}>{order.shippingInfo?.name || "N/A"}</td>
                          <td rowSpan={order.cart.length}>{order.shippingInfo?.address || "N/A"}</td>
                          <td rowSpan={order.cart.length}>{order.shippingInfo?.phone || "N/A"}</td>
                          <td rowSpan={order.cart.length}>{order.shippingInfo?.zipCode || "N/A"}</td>
                          <td rowSpan={order.cart.length}>
                            <span className={`status ${order.isShipped ? "delivered" : "pending"}`}>
                              {order.isShipped ? "Shipped" : "Pending"}
                            </span>
                          </td>
                          <td rowSpan={order.cart.length}>
                            {!order.isShipped && (
                              <button
                                className="action-button default"
                                onClick={() => handleMarkAsShipped(order._id)}
                              >
                                {order.isShipped ? "Shipped" : "Mark as Shipped"}
                              </button>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <h2>Menu</h2>
        <ul className="menu-list">
          {["All Orders", "Pending Orders", "Visual Data", "Inventory"].map((item) => (
    <li
      key={item}
      className={`menu-item ${menuOption === item ? "active" : ""}`}
      onClick={() => setMenuOption(item)}
    >
      <span className="menu-icon">
        {item === "All Orders" ? "📦" : item === "Pending Orders" ? "⏳" : item === "Visual Data" ? "📊" : "📋"}
      </span>
      {item}
    </li>
))}

        </ul>
        <div className="date-filters">
          <h3>Filter by Date</h3>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="Today">Today's Orders</option>
            <option value="Last 3 Days">Last 3 Days</option>
            <option value="Last 15 Days">Last 15 Days</option>
            <option value="Last Month">Last Month</option>
          </select>
        </div>
      </div>
      <div className="main-content">
  <div className="order-details">
    {loading ? (
      <p className="loading">Loading...</p>
    ) : error ? (
      <p className="error">{error}</p>
    ) : menuOption === "Visual Data" ? (
      <VisualData orders={orders} />
    ) : menuOption === "Inventory" ? (
      <Inventory />
    ) : (
      <>
        <h2>{menuOption}</h2>
        {renderOrders()}
      </>
    )}
  </div>
</div>


    </div>
  );
};

export default App;
