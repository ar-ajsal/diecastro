// const User = require("../../models/userSchema");
// const Address = require("../../models/addressSchema")






// const loadAddress = async (req, res) => {

//     try {
//         const userId = req.session.user;
//         const userData = await User.findById(userId);
//         const addressData = await Address.findOne({ userId: userId });

//         return res.render('address', { user: userData, addresses: addressData,session: req.session.user })

//     } catch (error) {

//         return res.redirect("/pageNotFound")
//     }
// }

// const postAddress = async (req, res) => {
//     try {
//         const userId = req.session.user;
//         const userData = await User.findById(userId);
//         const { name, phone, altPhone, pincode, landMark, city, state, addressType } = req.body;

//         const userAddress = await Address.findOne({ userId: userData._id })
//         if (!userAddress) {
//             const newAddress = new Address({
//                 userId: userData._id,
//                 address: [{ name, phone, altPhone, pincode, landMark, city, state, addressType }]
//             })
//             await newAddress.save()
//         } else {
//             userAddress.address.push({ name, phone, altPhone, pincode, landMark, city, state, addressType })
//             await userAddress.save()
//         }
//         res.redirect('/address')
//     } catch (error) {
//         res.redirect("/pageNotFound")

//     }
// }

// const deleteAddress = async (req, res) => {
//     try {
//         const addressId = req.params.id
//         const findAddress = await Address.findOne({"address._id":addressId})
//         if (!findAddress) {
//             return res.status(404).json({ success: false, message: "Address not found" })
//         }
//         await Address.updateOne({"address._id":addressId},{$pull:{address:{_id:addressId}}})
//         return res.redirect('/address');
//     } catch (error) {
//         console.error("Error in deleteAddress:", error)
//         res.status(500).json({ success: false, message: "Failed to delete Address " })
//     }
// }

// const editAddress = async (req, res) => {
    
//     const { addressId, name, landMark, city, state, pincode, phone, addressType, altPhone } = req.body;

//     try {
//         // Find the parent document containing the address array
//         const parentDoc = await Address.findOne({ "address._id": addressId });
//         if (!parentDoc) {
//             return res.status(404).json({ success: false, message: "Address not found" });
//         }

//         // Update the specific address in the array using positional operator $
//         await Address.updateOne(
//             { "address._id": addressId },
//             { $set: { 
//                 "address.$.name": name,
//                 "address.$.landMark": landMark,
//                 "address.$.city": city,
//                 "address.$.state": state,
//                 "address.$.pincode": pincode,
//                 "address.$.phone": phone,
//                 "address.$.addressType": addressType,
//                 "address.$.altPhone": altPhone
//             }}
//         );

//         return res.redirect('/address');
//     } catch (error) {
//         console.error("❌ Error updating address:", error);
//         return res.status(500).json({ message: "Internal Server Error" });
//     }
// }

// module.exports = {
//     loadAddress,
//     postAddress,
//     deleteAddress,
//     editAddress,
   
// };

const User = require("../../models/userSchema");
const Address = require("../../models/addressSchema");
const axios = require('axios');

const loadAddress = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        const addressData = await Address.findOne({ userId: userId });

        return res.render('address', { user: userData, addresses: addressData, session: req.session.user });
    } catch (error) {
        console.error("Error in loadAddress:", error);
        return res.redirect("/pageNotFound");
    }
};

const postAddress = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        const { name, phone, altPhone, pincode, landMark, city, state, addressType } = req.body;

        const userAddress = await Address.findOne({ userId: userData._id });
        if (!userAddress) {
            const newAddress = new Address({
                userId: userData._id,
                address: [{ name, phone, altPhone, pincode, landMark, city, state, addressType }]
            });
            await newAddress.save();
        } else {
            userAddress.address.push({ name, phone, altPhone, pincode, landMark, city, state, addressType });
            await userAddress.save();
        }
        res.redirect('/address');
    } catch (error) {
        console.error("Error in postAddress:", error);
        res.redirect("/pageNotFound");
    }
};

const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        const findAddress = await Address.findOne({ "address._id": addressId });
        if (!findAddress) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }
        await Address.updateOne({ "address._id": addressId }, { $pull: { address: { _id: addressId } } });
        return res.redirect('/address');
    } catch (error) {
        console.error("Error in deleteAddress:", error);
        res.status(500).json({ success: false, message: "Failed to delete Address" });
    }
};

const editAddress = async (req, res) => {
    const { addressId, name, landMark, city, state, pincode, phone, addressType, altPhone } = req.body;

    try {
        const parentDoc = await Address.findOne({ "address._id": addressId });
        if (!parentDoc) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        await Address.updateOne(
            { "address._id": addressId },
            {
                $set: {
                    "address.$.name": name,
                    "address.$.landMark": landMark,
                    "address.$.city": city,
                    "address.$.state": state,
                    "address.$.pincode": pincode,
                    "address.$.phone": phone,
                    "address.$.addressType": addressType,
                    "address.$.altPhone": altPhone
                }
            }
        );

        return res.redirect('/address');
    } catch (error) {
        console.error("Error updating address:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const getAddressFromCoordinates = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({ success: false, message: "Coordinates are required" });
        }

        console.log(`Received coordinates: Latitude=${latitude}, Longitude=${longitude}`);

        // Use OpenStreetMap Nominatim API for reverse geocoding
        const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'YourAppName/1.0 (your.email@example.com)' // Nominatim requires a User-Agent
                }
            }
        );

        const addressData = response.data;
        if (!addressData || !addressData.address) {
            console.error("No address found for coordinates:", { latitude, longitude });
            return res.status(404).json({ success: false, message: "Address not found for the given coordinates" });
        }

        // Extract relevant address components
        const address = {
            city: addressData.address.city || addressData.address.town || addressData.address.village || '',
            state: addressData.address.state || '',
            pincode: addressData.address.postcode || '',
            landMark: addressData.address.neighbourhood || addressData.address.suburb || addressData.address.road || '',
            street: addressData.address.road || ''
        };

        console.log("Fetched address:", address);

        return res.json({ success: true, address, coordinates: { latitude, longitude } });
    } catch (error) {
        console.error("Error fetching address from coordinates:", error.message);
        return res.status(500).json({ success: false, message: "Failed to fetch address" });
    }
};

module.exports = {
    loadAddress,
    postAddress,
    deleteAddress,
    editAddress,
    getAddressFromCoordinates
};