const Products = require('../models/productModel');

class APIfeatures{
    constructor(query, queryString){
        this.query = query;
        this.queryString = queryString;
    }

    //Filtering
    filtering(){
        const queryObj = {...this.queryString}

        const excludedFields = ['page', 'sort', 'limit']
        excludedFields.forEach(e1 => delete(queryObj[e1]));

        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lt|lte|regex)\b/g, match => '$' + match);

        this.query.find(JSON.parse(queryStr));

        return this;
    }

    sorting(){
        if (this.queryString.sort){
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        }
        else{
            this.query = this.query.sort('-createAt');
        }

        return this;
    }

    paginating(){
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 10;
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit);
        return this;
    }
}

const productController = {
    getProducts: async (req, res) => {
        try{
            const features = new APIfeatures(Products.find(), req.query)
                                    .filtering()
                                    .sorting()
                                    .paginating();
            
            const products = await features.query;

            res.json({
                status: 'success',
                result: products.length,
                products: products
            });

        }
        catch{
            return res.status(500).json({message: err.message});
        }
    },

    createProduct: async(req, res) => {
        try{
            const {product_id, title, price, description, content, images, category} = req.body;
            if (!images) return res.status(400).json({message: "No image upload"});

            const product = await Products.findOne({product_id});
            if (product) return res.status(400).json({message: "This product already exists"});

            const newProduct = new Products({
                product_id, title: title.toLowerCase(), price, description, content, images, category
            });

            await newProduct.save();
            res.json({message: "Created a product"});
        }   
        catch(err){
            return res.status(500).json({message: err.message});
        }
    },

    deleteProduct: async(req, res) => {
        try{
            await Products.findByIdAndDelete(req.params.id)
            res.json({message: "Product deleted"});
        }
        catch(err){
            return res.status(500).json({message: err.message});
        }
    },

    updateProduct: async(req, res) => {
        try{
            const {title, price, description, content, images, category} = req.body;
            if (!images) return res.status(400).json({message: "No image upload"});

            await Products.findOneAndUpdate({_id: req.params.id}, {
                title: title.toLowerCase(), price, description, content, images, category
            });

            res.json({message: "Updated a Product"});
        }
        catch(err){
            return res.status(500).json({message: err.message});
        }
    }
}

module.exports = productController