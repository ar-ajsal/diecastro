const Banner = require("../../models/bannerSchema");
const path = require("path");
const fs = require("fs");

const getBannerPage = async (req, res) => {
    try {
        const findBanner = await Banner.find({});
        res.render("banner", { data: findBanner });
    } catch (error) {
        console.error(error);
        res.redirect("/pageerror");
    }
};

const addBanner = async (req, res) => {
    try {
        const { title, description, link, startDate, endDate } = req.body;
        const image = req.file ? req.file.filename : null;

        if (!image) {
            return res.status(400).send("Image is required");
        }

        const newBanner = new Banner({
            image,
            title,
            description,
            link: link || null,
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        });

        await newBanner.save();
        res.redirect("/banner");
    } catch (error) {
        console.error(error);
        res.redirect("/pageerror");
    }
};

const editBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) {
            return res.redirect("/pageerror");
        }
        res.render("edit-banner", { banner });
    } catch (error) {
        console.error(error);
        res.redirect("/pageerror");
    }
};

const updateBanner = async (req, res) => {
    try {
        const { title, description, link, startDate, endDate } = req.body;
        const updateData = {
            title,
            description,
            link: link || null,
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        };

        if (req.file) {
            const oldBanner = await Banner.findById(req.params.id);
            if (oldBanner.image) {
                fs.unlinkSync(path.join(__dirname, "../../public/Uploads", oldBanner.image));
            }
            updateData.image = req.file.filename;
        }

        await Banner.findByIdAndUpdate(req.params.id, updateData);
        res.redirect("/banner");
    } catch (error) {
        console.error(error);
        res.redirect("/pageerror");
    }
};

const deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (banner.image) {
            fs.unlinkSync(path.join(__dirname, "../../public/Uploads", banner.image));
        }
        await Banner.findByIdAndDelete(req.params.id);
        res.redirect("/banner");
    } catch (error) {
        console.error(error);
        res.redirect("/pageerror");
    }
};

module.exports = {
    getBannerPage,
    addBanner,
    editBanner,
    updateBanner,
    deleteBanner
};