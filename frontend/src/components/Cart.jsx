import { useEffect, useState } from "react";
import {
  Trash2,
  Package,
  MapPin,
  CheckCircle2,
  Plus,
  Minus,
} from "lucide-react";


import Track from "./OrderTracker";

export default function Cart() {
  const API_BASE = "https://ellectra-beta.vercel.app/ellectra/v1";

  const [currentStep, setCurrentStep] = useState(1);
  const [items, setItems] = useState([]);

  // added missing states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // per-item loading map: { [cartIdOrTempId]: true|false }
  const [loadingItems, setLoadingItems] = useState({});

  // store raw user details object so we can reuse fields (like user_name) on save
  const [userDetails, setUserDetails] = useState(null);

  // keep address as state so we can update it after fetching user details
  const [defaultAddress, setDefaultAddress] = useState({
    doorNo: "123",
    address: "456 Main Street, Apartment 5B",
    city: "New York",
    landmark: "Near Central Park",
    pincode: "10001",
    phone: "+1 234-567-8900",
  });

  const [selectedAddress, setSelectedAddress] = useState("default");
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    doorNo: "",
    address: "",
    city: "",
    landmark: "",
    pincode: "",
    phone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");

  // platform fee config: right now set percent to 0 (you can change it)
  const PLATFORM_FEE_PERCENT = 0.0; // e.g., 0.02 for 2%

  // store orders returned by backend so we can display order tickets
  const [pastOrders, setPastOrders] = useState([]);

  // checkout loading
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // success popout/modal state
  const [showSuccessPopout, setShowSuccessPopout] = useState(false);
  const [successPopoutMessage, setSuccessPopoutMessage] = useState("");
  const [createdOrdersForPopout, setCreatedOrdersForPopout] = useState([]);
  const [successTimerId, setSuccessTimerId] = useState(null);

  // helper: set per-item loading flag
  const setItemLoading = (id, value) => {
    setLoadingItems((prev) => ({ ...prev, [id]: value }));
  };

  // ----------------------
  // Token helper
  // ----------------------
  const getToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  };

  // ----------------------
  // Fetch user details and map to address fields
  // - updated to handle keys you showed (user_doorno, user_address, user_city, user_pincode, Landmark, user_number, user_phone_no)
  // ----------------------
  const fetchUserDetails = async (signal) => {
    try {
      const token = getToken();
      if (!token) return; // no token: keep fallback

      const resp = await fetch(`${API_BASE}/users/user_details`, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        signal,
      });

      if (!resp.ok) {
        // don't throw — just keep fallback address
        console.warn("user_details fetch failed", resp.status);
        return;
      }

      const data = await resp.json();

      // Try to find user object in common response shapes
      const userObj = data?.user || data?.user_details || data?.data || data;

      // store raw user obj for later (used when saving)
      setUserDetails(userObj ?? null);

      // Map many possible field names, including the user_ prefixed keys you provided
      const mapped = {
        doorNo:
          userObj?.user_doorno ??
          userObj?.user_door_no ??
          userObj?.user_doornumber ??
          userObj?.doorNo ??
          userObj?.door_no ??
          userObj?.flat_no ??
          userObj?.door_number ??
          "",
        address:
          userObj?.user_address ??
          userObj?.address ??
          userObj?.address_line ??
          userObj?.street ??
          userObj?.addr ??
          "",
        city:
          userObj?.user_city ??
          userObj?.city ??
          userObj?.town ??
          userObj?.locality ??
          "",
        landmark:
          // note: API used "Landmark" (capital L) in your example — handle that too
          userObj?.Landmark ??
          userObj?.landmark ??
          userObj?.near ??
          "",
        pincode:
          userObj?.user_pincode ??
          userObj?.user_postal_code ??
          userObj?.pincode ??
          userObj?.pin ??
          userObj?.postal_code ??
          userObj?.zipcode ??
          "",
        // phone may be under several names; your API examples included user_phone_no and user_number
        phone:
          userObj?.user_phone_no ?? // new field you returned in the response
          userObj?.user_number ?? // number field from your save curl / response
          userObj?.user_phone ??
          userObj?.user_mobile ??
          userObj?.phone ??
          userObj?.phone_number ??
          userObj?.mobile ??
          userObj?.contact ??
          "",
      };

      // normalize phone to string (if numeric)
      if (mapped.phone && typeof mapped.phone === "number") {
        mapped.phone = String(mapped.phone);
      }

      // Only update if we have at least one non-empty field
      const hasAny = Object.values(mapped).some((v) => v && String(v).trim() !== "");
      if (hasAny) {
        // merge with current defaultAddress (don't wipe missing fields)
        setDefaultAddress((prev) => ({ ...prev, ...mapped }));

        // also prefill the edit form so user can immediately edit
        setAddressForm((prev) => ({
          ...prev,
          ...mapped,
        }));
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Error fetching user details:", err);
    }
  };

  // ----------------------
  // Fetch cart (reusable)
  // ----------------------
  const fetchCart = async (signal) => {
    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setError("No token found. Please log in.");
        setItems([]);
        setLoading(false);
        return;
      }

      const resp = await fetch(`${API_BASE}/cart/view`, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        signal,
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Failed to fetch cart: ${resp.status} ${text}`);
      }

      const data = await resp.json();

      const cartArray = Array.isArray(data) ? data : data.cart || [];

      const transformedItems = cartArray.map((item, index) => ({
        id: item.cart_id ?? item.id ?? `tmp-${index}`,
        pro_id: item.product_id ?? item.pro_id ?? null,
        name: item.product_name ?? item.name ?? "Product",
        category: item.category ?? "PRODUCT",
        color: item.color ?? "N/A",
        size: item.size ?? "N/A",
        price: parseFloat(item.price_per_item ?? item.price ?? 0),
        quantity: parseInt(item.quantity ?? 1, 10),
        selected: true,
        image:
          item.product_img ??
          item.image_url ??
          item.image ??
          "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200&h=200&fit=crop",
      }));

      setItems(transformedItems);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Error fetching cart:", err);
      setError(err.message || "Failed to load cart");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------
  // Mount: fetch user details then cart
  // ----------------------
  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      await fetchUserDetails(controller.signal);
      await fetchCart(controller.signal);
    })();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // cleanup success timer on unmount
  useEffect(() => {
    return () => {
      if (successTimerId) clearTimeout(successTimerId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successTimerId]);

  // ----------------------
  // Cart mutation APIs
  // ----------------------
  const addToCartAPI = async (pro_id, quantity = 1) => {
    const token = getToken();
    if (!token) throw new Error("No token");

    const resp = await fetch(`${API_BASE}/cart/add`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pro_id, quantity }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Add to cart failed: ${resp.status} ${text}`);
    }

    return resp.json();
  };

  const updateCartAPI = async (cart_id, quantity) => {
    const token = getToken();
    if (!token) throw new Error("No token");

    const resp = await fetch(`${API_BASE}/cart/update/${encodeURIComponent(cart_id)}`, {
      method: "PUT",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quantity }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Update cart failed: ${resp.status} ${text}`);
    }

    return resp.json();
  };

  const deleteCartAPI = async (cart_id) => {
    const token = getToken();
    if (!token) throw new Error("No token");

    const resp = await fetch(`${API_BASE}/cart/delete/${encodeURIComponent(cart_id)}`, {
      method: "DELETE",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Delete cart item failed: ${resp.status} ${text}`);
    }

    return resp.json();
  };

  // ----------------------
  // Handlers (increase/decrease/delete) — call APIs then refetch cart
  // ----------------------
  const handleIncrease = async (item) => {
    const key = item.id ?? item.pro_id ?? `tmp-${Math.random()}`;
    setItemLoading(key, true);

    try {
      if (item.id && String(item.id).startsWith("CART")) {
        const newQty = item.quantity + 1;
        setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, quantity: newQty } : it)));
        await updateCartAPI(item.id, newQty);
        await fetchCart();
      } else if (item.pro_id) {
        await addToCartAPI(item.pro_id, 1);
        await fetchCart();
      } else {
        throw new Error("Product id not found");
      }
    } catch (err) {
      console.error("Error increasing quantity:", err);
      setError(err.message || "Failed to increase quantity");
      await fetchCart();
    } finally {
      setItemLoading(key, false);
    }
  };

  const handleDecrease = async (item) => {
    if ((item.quantity ?? 1) <= 1) return;
    const key = item.id ?? item.pro_id ?? `tmp-${Math.random()}`;
    setItemLoading(key, true);

    try {
      if (item.id && String(item.id).startsWith("CART")) {
        const newQty = Math.max(1, item.quantity - 1);
        setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, quantity: newQty } : it)));
        await updateCartAPI(item.id, newQty);
        await fetchCart();
      } else if (item.pro_id) {
        await addToCartAPI(item.pro_id, 1);
        await fetchCart();
      } else {
        throw new Error("Product id not found");
      }
    } catch (err) {
      console.error("Error decreasing quantity:", err);
      setError(err.message || "Failed to decrease quantity");
      await fetchCart();
    } finally {
      setItemLoading(key, false);
    }
  };

  const handleDelete = async (item) => {
    const key = item.id ?? item.pro_id ?? `tmp-${Math.random()}`;
    setItemLoading(key, true);

    try {
      if (item.id && String(item.id).startsWith("CART")) {
        await deleteCartAPI(item.id);
        await fetchCart();
      } else {
        setItems((prev) => prev.filter((it) => it !== item));
      }
    } catch (err) {
      console.error("Error deleting item:", err);
      setError(err.message || "Failed to delete item");
      await fetchCart();
    } finally {
      setItemLoading(key, false);
    }
  };

  // ----------------------
  // Address handlers
  // ----------------------
  const handleAddressChange = (field, value) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
  };

  // When Edit Address is clicked, prefill the form with current defaultAddress
  const onEditAddress = () => {
    setAddressForm({ ...defaultAddress });
    setIsEditingAddress(true);
  };

  // Save address locally and persist to backend (PUT /users/user_info_change)
  // The payload keys follow the curl you provided.
  const saveAddress = async () => {
    // basic validation (ensure required fields present)
    // you can extend this as needed
    const token = getToken();
    if (!token) {
      setError("Not logged in");
      return;
    }

    // prepare payload following API keys you showed in curl
    const payload = {
      landmark: addressForm.landmark ?? "",
      user_address: addressForm.address ?? "",
      user_city: addressForm.city ?? "",
      user_door_no: addressForm.doorNo ?? "",
      user_name: userDetails?.user_name ?? userDetails?.userName ?? "", // best-effort user name
      // convert phone to number if possible; backend in your example expects numeric user_number
      user_number: addressForm.phone ? Number(String(addressForm.phone).replace(/\D/g, "")) : null,
      user_pincode: addressForm.pincode ?? "",
    };

    try {
      setLoading(true);
      setError(null);

      const resp = await fetch(`${API_BASE}/users/user_info_change`, {
        method: "PUT",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Failed to save address: ${resp.status} ${text}`);
      }

      const result = await resp.json();

      // assume backend returns updated user object or success status; refetch to be safe
      await fetchUserDetails();
      // update UI address immediately as well
      setDefaultAddress((prev) => ({ ...prev, ...addressForm }));
      setIsEditingAddress(false);
    } catch (err) {
      console.error("Error saving address:", err);
      setError(err.message || "Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setAddressForm({
      doorNo: "",
      address: "",
      city: "",
      landmark: "",
      pincode: "",
      phone: "",
    });
    setIsEditingAddress(false);
  };

  // ----------------------
  // Selection helpers & totals
  // ----------------------
  const toggleItemSelection = (id) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item)));
  };

  const toggleSelectAll = () => {
    const allSelected = items.length > 0 && items.every((item) => item.selected);
    setItems((prev) => prev.map((item) => ({ ...item, selected: !allSelected })));
  };

  const selectedItems = items.filter((item) => item.selected);
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // platform fee calculation (configurable via PLATFORM_FEE_PERCENT)
  const platformFee = parseFloat((subtotal * PLATFORM_FEE_PERCENT).toFixed(2));

  // final total includes platformFee
  const total = subtotal + platformFee;

  // ----------------------
  // When user selects an address radio row, ensure phone shown matches that address
  // ----------------------
  const onSelectAddress = (value) => {
    setSelectedAddress(value);
    if (value === "default") {
      // ensure default phone is shown in addressForm (so UI updates)
      setAddressForm((prev) => ({ ...prev, phone: defaultAddress.phone ?? prev.phone }));
    }
    // If you add more saved addresses later, handle them here
  };

  // ----------------------
  // Checkout: call past_order/add for each selected item
  // On success: show a success popout, hide selected items, then after 20s show Past Orders
  // ----------------------
  const handleCheckout = async () => {
    if (selectedItems.length === 0) return;
    const token = getToken();
    if (!token) {
      setError("Not logged in");
      return;
    }

    setCheckoutLoading(true);
    setError(null);

    // Build address values (prefer the selected address, fallback to form/default)
    const addr = {
      delivery_address:
        selectedAddress === "default"
          ? `${defaultAddress.doorNo || ""}${defaultAddress.address ? ", " + defaultAddress.address : ""}`.trim()
          : addressForm.address || defaultAddress.address || "",
      city: selectedAddress === "default" ? defaultAddress.city : addressForm.city || defaultAddress.city,
      pincode: selectedAddress === "default" ? defaultAddress.pincode : addressForm.pincode || defaultAddress.pincode,
      landmark: selectedAddress === "default" ? defaultAddress.landmark : addressForm.landmark || defaultAddress.landmark,
      user_number: Number(String(addressForm.phone || defaultAddress.phone || "").replace(/\D/g, "")) || null,
    };

    try {
      // send one request per selected item (model PastOrderCreate expects a single pro_id)
      const postPromises = selectedItems.map(async (item) => {
        const payload = {
          pro_id: item.pro_id ?? item.id ?? String(item.name),
          quantity: item.quantity,
          total_amount: parseFloat((item.price * item.quantity).toFixed(2)),
          payment_status: paymentMethod === "cod" ? "Pending" : "Paid",
          delivery_address: addr.delivery_address,
          city: addr.city,
          pincode: String(addr.pincode ?? ""),
          landmark: addr.landmark,
          delivery_type: "Home Delivery",
          user_number: addr.user_number,
        };

        const resp = await fetch(`${API_BASE}/past_order/add`, {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(`Order create failed for ${item.name}: ${resp.status} ${text}`);
        }

        const data = await resp.json();
        // standardize returned order object for local display
        return {
          orderResponse: data,
          pro_id: payload.pro_id,
          quantity: payload.quantity,
          total_amount: payload.total_amount,
          payment_status: payload.payment_status,
          delivery_address: payload.delivery_address,
          city: payload.city,
          pincode: payload.pincode,
          landmark: payload.landmark,
          delivery_type: payload.delivery_type,
        };
      });

      const results = await Promise.all(postPromises);

      // On success: hide all selected items from cart (your request said hide all -> we'll clear selected items)
      setItems((prev) => prev.filter((it) => !it.selected));

      // store created orders and show popout
      setCreatedOrdersForPopout(results);
      setPastOrders((prev) => [...results, ...prev]);

      // show success popout with festival message
      setSuccessPopoutMessage("Order placed successfully — Fevestival!");
      setShowSuccessPopout(true);

      // automatically hide popout and navigate to Past Orders after 20 seconds
      const timer = setTimeout(() => {
        setShowSuccessPopout(false);
        setCurrentStep(3);
        setCreatedOrdersForPopout([]);
      }, 20000); // 20 seconds
      setSuccessTimerId(timer);

      // If user wants immediate redirection uncomment the line below:
      // setCurrentStep(3);
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.message || "Checkout failed");
    } finally {
      setCheckoutLoading(false);
    }
  };

  // allow manual dismiss of popout and immediate navigation
  const dismissSuccessPopout = () => {
    if (successTimerId) {
      clearTimeout(successTimerId);
      setSuccessTimerId(null);
    }
    setShowSuccessPopout(false);
    if (createdOrdersForPopout.length > 0) {
      setCurrentStep(3);
      setCreatedOrdersForPopout([]);
    }
  };

  // ----------------------
  // Render content (unchanged structure but with added popout rendering)
  // ----------------------
  const renderStepContent = () => {
    if (currentStep === 2) {
        return(
            <>
            <Track />
            </>
        )
    }

    if (currentStep === 3) {
      return (
      <>
      </>
      );
    }

    return (
      <>
        {/* Shopping Cart Content */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold">Shopping Bag</h1>
            <button onClick={toggleSelectAll} className="text-sm font-medium text-blue-600 hover:text-blue-700">
              {items.length > 0 && items.every((item) => item.selected) ? "Deselect All" : "Select All"}
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-6">{items.length} items in your bag.</p>

          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="hidden lg:grid grid-cols-12 gap-4 pb-4 border-b border-gray-200 mb-6">
              <div className="col-span-1"></div>
              <div className="col-span-4">
                <h2 className="font-semibold">Product</h2>
              </div>
              <div className="col-span-2 text-center">
                <h2 className="font-semibold">Price</h2>
              </div>
              <div className="col-span-2 text-center">
                <h2 className="font-semibold">Quantity</h2>
              </div>
              <div className="col-span-2 text-center">
                <h2 className="font-semibold">Total Price</h2>
              </div>
              <div className="col-span-1 text-center">
                <h2 className="font-semibold">Action</h2>
              </div>
            </div>

            {loading && <p className="text-gray-500 text-center py-6">Loading cart...</p>}
            {error && <p className="text-red-500 text-center py-2">{error}</p>}

            {/* Product Items */}
            {items.map((item) => {
              const key = item.id ?? item.pro_id;
              const itemLoading = !!loadingItems[key];
              const disableDecrease = (item.quantity ?? 1) <= 1 || itemLoading;

              return (
                <div key={key} className="border-b border-gray-100 last:border-0 py-4 lg:py-6">
                  {/* Desktop Layout */}
                  <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 flex justify-center">
                      <input
                        type="checkbox"
                        checked={!!item.selected}
                        onChange={() => toggleItemSelection(item.id)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                    <div className="col-span-4 flex gap-4">
                      <img src={item.image} alt={item.name} className="w-24 h-24 rounded-lg object-cover bg-gray-100" />
                      <div className="flex flex-col justify-center">
                        <p className="text-xs text-gray-500 uppercase mb-1">{item.category}</p>
                        <h3 className="font-semibold mb-2">{item.name}</h3>
                        <div className="text-xs text-gray-600 space-y-1">
                          <p>
                            Color <span className="ml-2">• {item.color}</span>
                          </p>
                          <p>
                            Size <span className="ml-2">• {item.size}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <p className="font-semibold">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="col-span-2 flex justify-center items-center gap-3">
                      <button
                        onClick={() => handleDecrease(item)}
                        className={`w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 ${disableDecrease ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        disabled={disableDecrease}
                        aria-label={`Decrease quantity for ${item.name}`}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleIncrease(item)}
                        className={`w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 ${itemLoading ? "opacity-70 cursor-wait" : ""
                          }`}
                        disabled={itemLoading}
                        aria-label={`Increase quantity for ${item.name}`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="col-span-2 text-center">
                      <p className="font-bold text-yellow-500 text-lg">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => handleDelete(item)}
                        className="w-10 h-10 rounded-full hover:bg-red-50 flex items-center justify-center text-red-500 hover:text-red-600 transition"
                        title="Delete item"
                        aria-label={`Delete ${item.name}`}
                        disabled={itemLoading}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Mobile Layout - Stack Vertically */}
                  <div className="lg:hidden space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 pt-1">
                        <input
                          type="checkbox"
                          checked={!!item.selected}
                          onChange={() => toggleItemSelection(item.id)}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </div>
                      <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase">{item.category}</p>
                        <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                        <div className="text-xs text-gray-600 mt-1">
                          <p>Color: {item.color}</p>
                          <p>Size: {item.size}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-2 hover:bg-red-50 rounded-full text-red-500 hover:text-red-600 h-fit"
                        disabled={itemLoading}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="flex justify-between items-center pl-8">
                      <div>
                        <p className="text-xs text-gray-600">Price</p>
                        <p className="font-semibold">${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDecrease(item)}
                          className={`w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center ${disableDecrease ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          disabled={disableDecrease}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                        <button
                          onClick={() => handleIncrease(item)}
                          className={`w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center ${itemLoading ? "opacity-70 cursor-wait" : ""
                            }`}
                          disabled={itemLoading}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Total</p>
                        <p className="font-bold text-yellow-500">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {items.length === 0 && !loading && !error && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Your shopping bag is empty</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Checkout Details */}
        <div className="w-full lg:w-96">
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm mb-4 sm:mb-6">
            <h2 className="text-lg font-semibold mb-4">Delivery Address</h2>

            {!isEditingAddress ? (
              <>
                <div className="mb-4">
                  <label className="flex items-start p-4 border-2 border-blue-500 bg-blue-50 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      checked={selectedAddress === "default"}
                      onChange={() => onSelectAddress("default")}
                      className="w-4 h-4 mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="ml-3 flex-1">
                      <p className="font-semibold text-sm">Default Address</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {defaultAddress.doorNo}, {defaultAddress.address}
                      </p>
                      <p className="text-xs text-gray-600">
                        {defaultAddress.city}, {defaultAddress.landmark} - {defaultAddress.pincode}
                      </p>
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <p className="text-xs text-gray-500">Contact Number</p>
                        <p className="text-sm font-semibold text-gray-800">{defaultAddress.phone || addressForm.phone || "Not provided"}</p>
                      </div>
                    </div>
                  </label>
                </div>
                <button onClick={onEditAddress} className="w-full bg-black text-white py-3 rounded-full font-medium hover:bg-gray-800 transition text-sm sm:text-base">
                  Edit Address
                </button>
              </>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Door No / Flat No</label>
                    <input type="text" placeholder="Enter door number" value={addressForm.doorNo} onChange={(e) => handleAddressChange("doorNo", e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                    <textarea placeholder="Enter street address" value={addressForm.address} onChange={(e) => handleAddressChange("address", e.target.value)} rows={2} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                    <input type="text" placeholder="Enter city" value={addressForm.city} onChange={(e) => handleAddressChange("city", e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Landmark</label>
                    <input type="text" placeholder="Enter landmark (optional)" value={addressForm.landmark} onChange={(e) => handleAddressChange("landmark", e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Pincode</label>
                    <input type="text" placeholder="Enter pincode" value={addressForm.pincode} onChange={(e) => handleAddressChange("pincode", e.target.value)} maxLength={6} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                    <input type="tel" placeholder="Enter phone number" value={addressForm.phone} onChange={(e) => handleAddressChange("phone", e.target.value)} maxLength={15} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={cancelEdit} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-full font-medium hover:bg-gray-300 transition text-sm sm:text-base">Cancel</button>
                  <button onClick={saveAddress} className="flex-1 bg-black text-white py-3 rounded-full font-medium hover:bg-gray-800 transition text-sm sm:text-base">Save</button>
                </div>
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm mb-4 sm:mb-6">
            <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
            <div className="space-y-3">
              {/* 🟡 Online Payment - Disabled */}
              <label
                className="flex items-center p-4 border-2 rounded-lg cursor-not-allowed opacity-60 border-gray-300 bg-gray-50"
              >
                <input
                  type="radio"
                  name="payment"
                  value="online"
                  disabled
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-not-allowed"
                />
                <div className="ml-3 flex-1">
                  <p className="font-semibold text-sm flex items-center gap-2">
                    Online Payment
                    <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
                      Coming Soon
                    </span>
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Pay securely using Credit/Debit Card, UPI, Net Banking
                  </p>
                </div>
                <div className="text-2xl">💳</div>
              </label>

              {/* 🟢 Cash on Delivery - Active */}
              <label
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                  paymentMethod === "cod"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-blue-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <p className="font-semibold text-sm">Cash on Delivery</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Pay with cash when your order is delivered
                  </p>
                </div>
                <div className="text-2xl">💵</div>
              </label>
            </div>
          </div>

          <div className="bg-yellow-200 rounded-2xl p-4 sm:p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4 sm:mb-6">Cart Total</h2>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm sm:text-base">
                <span>Total Price</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base">
                <span>Delivery</span>
                <span className="font-semibold">Free</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base">
                <span>Platform Fee ({(PLATFORM_FEE_PERCENT * 100).toFixed(2)}%)</span>
                <span className="font-semibold">${platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-yellow-300">
                <span className="font-semibold text-sm sm:text-base">Cart Total</span>
                <span className="font-bold text-lg sm:text-xl">${total.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              disabled={selectedItems.length === 0 || checkoutLoading}
              className="w-full bg-white text-black py-3 rounded-full font-semibold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {checkoutLoading ? "Processing..." : `Checkout (${selectedItems.length} ${selectedItems.length === 1 ? "item" : "items"}) — Pay ${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 pt-30 pb-10 px-5">
      <div className="max-w-7xl mx-auto">
        {/* Step Tracker */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[
              { number: 1, label: "Shopping Cart", icon: Package },
              { number: 2, label: "Track Order", icon: MapPin },
              { number: 3, label: "Past Orders", icon: CheckCircle2 },
            ].map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              return (
                <div key={step.number} className="flex items-center">
                  <button onClick={() => setCurrentStep(step.number)} className="flex flex-col items-center relative group">
                    {/* Animated pulse ring for active step */}
                    {isActive && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-16 sm:h-16">
                        <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75"></div>
                      </div>
                    )}
                    <div className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-2 transition-all duration-500 ease-out ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-300 scale-110" : isCompleted ? "bg-green-600 text-white shadow-md scale-100" : "bg-gray-300 text-gray-600 scale-90"} ${isActive ? "animate-bounce-subtle" : ""}`}>
                      {isCompleted && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CheckCircle2 size={16} className="absolute text-white animate-scale-in" />
                        </div>
                      )}
                      <Icon size={24} className={`transition-transform duration-300 ${isActive ? "scale-110" : ""}`} />
                    </div>
                    <span className={`text-xs sm:text-sm font-medium transition-all duration-300 ${isActive ? "text-blue-600 font-bold" : "text-gray-600"}`}>{step.label}</span>
                    <div className={`absolute -inset-2 rounded-lg transition-opacity duration-300 ${!isActive && !isCompleted ? "group-hover:bg-gray-100 opacity-0 group-hover:opacity-100" : ""}`}></div>
                  </button>

                  {index < 2 && (
                    <div className="relative h-1 w-12 sm:w-24 mx-2 mb-6 bg-gray-300 rounded-full overflow-hidden">
                      <div className={`absolute inset-0 bg-gradient-to-r from-green-600 to-green-500 rounded-full transition-all duration-700 ease-out ${currentStep > step.number ? "translate-x-0" : "-translate-x-full"}`}></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom CSS for animations */}
        <style>{`
          @keyframes bounce-subtle {
            0%, 100% {
              transform: scale(1.1) translateY(0);
            }
            50% {
              transform: scale(1.1) translateY(-4px);
            }
          }

          @keyframes scale-in {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            50% {
              transform: scale(1.2);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }

          .animate-bounce-subtle {
            animation: bounce-subtle 2s ease-in-out infinite;
          }

          .animate-scale-in {
            animation: scale-in 0.5s ease-out forwards;
          }
        `}</style>

        {/* Content Based on Step */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">{renderStepContent()}</div>
      </div>

      {/* Success Popout / Modal */}
      {showSuccessPopout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={dismissSuccessPopout}></div>
          <div className="relative max-w-md w-full bg-white rounded-xl shadow-xl p-6 mx-4">
            <h3 className="text-lg font-bold mb-2">{successPopoutMessage}</h3>
            <p className="text-sm text-gray-600 mb-4">
              Thank you! Your order{createdOrdersForPopout.length > 1 ? "s have" : " has"} been placed. We will show your order ticket shortly.
            </p>

            {/* show brief summary of created orders */}
            <div className="space-y-2 max-h-40 overflow-auto mb-4">
              {createdOrdersForPopout.map((o, i) => {
                const idFromServer = o.orderResponse?.id ?? o.orderResponse?.order_id ?? `local-${i}`;
                const displayAmount = o.total_amount ?? o.orderResponse?.total_amount ?? 0;
                return (
                  <div key={idFromServer} className="border rounded-md p-2 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <div className="font-medium">Order #{idFromServer}</div>
                        <div className="text-xs text-gray-600">Qty: {o.quantity}</div>
                      </div>
                      <div className="text-sm font-semibold">${displayAmount.toFixed(2)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button onClick={dismissSuccessPopout} className="flex-1 py-2 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700">
                View Orders Now
              </button>
              <button
                onClick={() => {
                  // simply close popout but keep on same page (auto will navigate after timeout)
                  if (successTimerId) {
                    clearTimeout(successTimerId);
                    setSuccessTimerId(null);
                  }
                  setShowSuccessPopout(false);
                }}
                className="py-2 px-4 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}