import { useEffect, useState } from 'react';
import { User, Mail, Phone, MapPin, Home, Map, Landmark, Loader2, AlertCircle } from 'lucide-react';

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    doorNo: '',
    landmark: '',
    address: '',
    city: '',
    pincode: '',
  });

  const [editData, setEditData] = useState({ ...userData });
  const [validationErrors, setValidationErrors] = useState({});

  const safe = (val) => (val === null || val === 'null' ? '' : val);

  // 🟦 Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('User not logged in.');
          setIsLoading(false);
          return;
        }

        const response = await fetch('https://ellectra-beta.vercel.app/ellectra/v1/users/user_details', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch user details');
        }

        const formattedData = {
          name: safe(data.user_name),
          email: safe(data.user_email),
          phone: safe(data.user_phone_no),
          doorNo: safe(data.user_doorno),
          landmark: safe(data.Landmark),
          address: safe(data.user_address),
          city: safe(data.user_city),
          pincode: safe(data.user_pincode),
        };

        setUserData(formattedData);
        setEditData(formattedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  const handleInputChange = (field, value) => {
    setEditData({ ...editData, [field]: value });
    setValidationErrors({ ...validationErrors, [field]: '' });
  };

  // 🟧 Validation
  const validateInputs = () => {
    const errors = {};

    if (!editData.name.trim() || editData.name.length < 2)
      errors.name = 'Name must be at least 2 characters.';
    if (!/^\d{10}$/.test(editData.phone))
      errors.phone = 'Phone must be a valid 10-digit number.';
    if (editData.pincode && !/^\d{6}$/.test(editData.pincode))
      errors.pincode = 'Pincode must be 6 digits.';
    if (!editData.city.trim()) errors.city = 'City is required.';
    if (!editData.address.trim()) errors.address = 'Address cannot be empty.';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 🟢 Save Changes
  const handleSave = async () => {
    if (!validateInputs()) return;

    try {
      setIsSaving(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('User not logged in.');
        setIsSaving(false);
        return;
      }

      const payload = {
        Landmark: editData.landmark,
        user_address: editData.address,
        user_city: editData.city,
        user_door_no: editData.doorNo,
        user_name: editData.name,
        user_number: Number(editData.phone),
        user_pincode: editData.pincode,
      };

      const response = await fetch('https://ellectra-beta.vercel.app/ellectra/v1/users/user_info_change', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || 'Failed to update user info');
      }

      setUserData(editData);
      setSuccessMsg('✅ Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Update failed. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({ ...userData });
    setIsEditing(false);
    setValidationErrors({});
  };

  // 🟡 Loading UI
  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center text-lg text-gray-600">
        Loading user profile...
      </div>
    );

  // 🔴 Error UI
  if (error && !isEditing)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-500 text-lg text-center">
        <AlertCircle className="w-10 h-10 mb-3" />
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
        >
          Try Again
        </button>
      </div>
    );

  // 🟩 MAIN UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-12 px-4">
      <div className="max-w-4xl mx-auto mt-10">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-[#22BDF5] to-blue-500 h-32"></div>
          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 md:-mt-12">
              <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <User className="w-16 h-16 text-gray-400" />
              </div>
              <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left flex-1">
                <h1 className="text-3xl font-bold text-gray-800">{userData.name}</h1>
                <p className="text-gray-600">{userData.email}</p>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="mt-4 md:mt-0 px-6 py-2 bg-[#22BDF5] text-black font-bold rounded-full hover:bg-blue-400 transition-colors"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </div>

        {/* Success */}
        {successMsg && (
          <div className="bg-green-100 text-green-800 border border-green-400 px-4 py-2 rounded mb-4 text-center font-semibold">
            {successMsg}
          </div>
        )}

        {/* Error message during edit */}
        {error && isEditing && (
          <div className="bg-red-100 text-red-800 border border-red-400 px-4 py-2 rounded mb-4 text-center font-semibold">
            ❌ {error}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Personal Information</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { label: 'Full Name', icon: <User className="text-[#22BDF5]" />, field: 'name' },
              { label: 'Email Address', icon: <Mail className="text-green-600" />, field: 'email', readOnly: true },
              { label: 'Phone Number', icon: <Phone className="text-purple-600" />, field: 'phone' },
              { label: 'Door No', icon: <Home className="text-indigo-600" />, field: 'doorNo' },
              { label: 'Address', icon: <Home className="text-orange-600" />, field: 'address', type: 'textarea' },
              { label: 'Landmark', icon: <Landmark className="text-teal-600" />, field: 'landmark' },
              { label: 'City', icon: <Map className="text-red-600" />, field: 'city' },
              { label: 'Pincode', icon: <MapPin className="text-yellow-600" />, field: 'pincode' },
            ].map(({ label, icon, field, readOnly, type }) => (
              <div key={field} className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">{icon}</div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">{label}</label>
                  {isEditing && !readOnly ? (
                    type === 'textarea' ? (
                      <textarea
                        value={editData[field]}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        rows="2"
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none ${
                          validationErrors[field]
                            ? 'border-red-400'
                            : 'border-gray-300 focus:border-[#22BDF5]'
                        }`}
                      />
                    ) : (
                      <input
                        type="text"
                        value={editData[field]}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none ${
                          validationErrors[field]
                            ? 'border-red-400'
                            : 'border-gray-300 focus:border-[#22BDF5]'
                        }`}
                      />
                    )
                  ) : (
                    <p className="text-lg text-gray-800 font-light">{userData[field]}</p>
                  )}
                  {validationErrors[field] && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors[field]}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isEditing && (
            <div className="flex gap-4 mt-8 justify-end">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-3 bg-[#22BDF5] text-black font-bold rounded-lg border-2 border-black shadow-[4px_4px_0px_black] hover:translate-x-1 hover:translate-y-1 hover:shadow-[1px_1px_0px_black] transition-all duration-100 flex items-center justify-center disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin mr-2" /> Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
