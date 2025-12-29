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
        res.json({ success: true, message: "Address added successfully" });
    } catch (error) {
        console.error("Error in postAddress:", error);
        res.status(500).json({ success: false, message: "Server error" });
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
        return res.json({ success: true, message: "Address deleted successfully" });
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

        return res.json({ success: true, message: "Address updated successfully" });
    } catch (error) {
        console.error("Error updating address:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const getAddressFromCoordinates = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        // User provided API Key
        const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyCUdGbOlp9Jp5ELRMFSoPZz20wq05ZaVOo';

        if (!latitude || !longitude) {
            return res.status(400).json({ success: false, message: "Coordinates are required" });
        }

        console.log(`Received coordinates: Latitude=${latitude}, Longitude=${longitude}`);

        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
        );

        const data = response.data;

        if (data.status !== 'OK' || !data.results || data.results.length === 0) {
            console.error("Google Maps API Error or No Results:", data.status);
            return res.status(404).json({ success: false, message: "Address not found for the given coordinates" });
        }

        const result = data.results[0];
        const components = result.address_components;

        let city = '';
        let state = '';
        let pincode = '';
        let landMark = '';

        // Helper to find component by type
        const getComponent = (type) => components.find(c => c.types.includes(type))?.long_name || '';

        city = getComponent('locality') || getComponent('administrative_area_level_2');
        state = getComponent('administrative_area_level_1');
        pincode = getComponent('postal_code');

        // Construct a landmark from specific components
        const sublocality = getComponent('sublocality');
        const neighborhood = getComponent('neighborhood');
        const street = getComponent('route');
        const premise = getComponent('premise');

        // Prioritize meaningful landmark parts
        let landmarkParts = [];
        if (premise) landmarkParts.push(premise);
        if (street) landmarkParts.push(street);
        if (sublocality) landmarkParts.push(sublocality);
        if (neighborhood) landmarkParts.push(neighborhood);

        landMark = landmarkParts.join(', ');

        const address = {
            city: city,
            state: state,
            pincode: pincode,
            landMark: landMark
        };

        console.log("Fetched address (Google):", address);

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