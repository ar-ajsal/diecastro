// const { Blog, Comment } = require('../../models/blogSchema');
// const slugify = require('slugify');
// const path = require('path');

// // Get all blogs for grid/list view
// exports.getBlogs = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = 9;
//     const skip = (page - 1) * limit;
//     const search = req.query.search || '';
//     const tag = req.query.tag || '';
//     const category = req.query.category || '';

//     let query = {};
//     if (search) {
//       query.title = { $regex: search, $options: 'i' };
//     }
//     if (tag) {
//       query.tags = tag;
//     }
//     if (category) {
//       query.categories = category;
//     }

//     const blogs = await Blog.find(query).skip(skip).limit(limit);
//     const totalBlogs = await Blog.countDocuments(query);
//     const totalPages = Math.ceil(totalBlogs / limit);

//     res.render('blog-grid', {
//       blogs,
//       currentPage: page,
//       totalPages,
//       view: req.query.view || 'grid',
//       search,
//       tag,
//       category,
//       session: req.session,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server Error');
//   }
// };

// // Render form to add new blog
// exports.getAddBlog = (req, res) => {
//   res.render('add-blog');
// };

// // Add new blog with image upload
// exports.postBlog = async (req, res) => {
//   try {
//     const { title, content, author, tags, categories, authorName, authorTitle, authorDescription } = req.body;
//     const image = req.file ? `/uploads/${req.file.filename}` : '';

//     // Generate slug from title
//     let slug = slugify(title, { lower: true, strict: true });
//     let uniqueSlug = slug;
//     let counter = 1;

//     // Ensure slug is unique
//     while (await Blog.findOne({ slug: uniqueSlug })) {
//       uniqueSlug = `${slug}-${counter}`;
//       counter++;
//     }

//     const blog = new Blog({
//       title,
//       slug: uniqueSlug,
//       content,
//       author,
//       image,
//       tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
//       categories: categories ? categories.split(',').map(cat => cat.trim()) : [],
//       authorBio: {
//         name: authorName || 'Mark Grey',
//         title: authorTitle || 'Web Designer',
//         description: authorDescription,
//         image: '/images/user/1.jpg'
//       }
//     });

//     await blog.save();
//     res.redirect('/blogs');
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server Error');
//   }
// };

// // Get single blog details
// exports.getBlogDetails = async (req, res) => {
//   try {
//     const blog = await Blog.findOne({ slug: req.params.slug }).populate({
//       path: 'comments',
//       populate: { path: 'parentComment' }
//     });
//     if (!blog) {
//       return res.status(404).send('Blog not found');
//     }
//     res.render('blog-detail', { blog });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server Error');
//   }
// };

// // Add new comment
// exports.postComment = async (req, res) => {
//   try {
//     const { name, email, subject, phone, message, parentComment } = req.body;
//     const slug = req.params.slug;

//     const comment = new Comment({
//       name,
//       email,
//       subject,
//       phone,
//       message,
//       parentComment: parentComment || null
//     });

//     await comment.save();

//     const blog = await Blog.findOne({ slug });
//     blog.comments.push(comment._id);
//     await blog.save();

//     res.redirect(`/blogs/${slug}`);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server Error');
//   }
// };

// // Increment likes
// exports.likeBlog = async (req, res) => {
//   try {
//     const blog = await Blog.findOne({ slug: req.params.slug });
//     if (!blog) {
//       return res.status(404).send('Blog not found');
//     }
//     blog.likes += 1;
//     await blog.save();
//     res.redirect(`/blogs/${blog.slug}`);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server Error');
//   }
// };

const { Blog, Comment } = require('../../models/blogSchema');
const slugify = require('slugify');
const path = require('path');
const mongoose = require('mongoose');

// Get all blogs for grid/list view
exports.getBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const tag = req.query.tag || '';
    const category = req.query.category || '';

    let query = {};
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (tag) {
      query.tags = tag;
    }
    if (category) {
      query.categories = category;
    }

    const blogs = await Blog.find(query).skip(skip).limit(limit).lean();
    const totalBlogs = await Blog.countDocuments(query);
    const totalPages = Math.ceil(totalBlogs / limit);

    res.render('blog-grid', {
      blogs,
      currentPage: page,
      totalPages,
      view: req.query.view || 'grid',
      search,
      tag,
      category,
      session:req.session
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).render('error', { message: 'Server Error: Unable to fetch blogs' });
  }
};

// Render form to add new blog
exports.getAddBlog = (req, res) => {
  res.render('add-blog');
};

// Add new blog with image upload
exports.postBlog = async (req, res) => {
  try {
    const { title, content, author, tags, categories, authorName, authorTitle, authorDescription } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : '';

    if (!title || !content || !image) {
      return res.status(400).render('add-blog', { error: 'Title, content, and image are required' });
    }

    // Generate slug from title
    let slug = slugify(title, { lower: true, strict: true });
    let uniqueSlug = slug;
    let counter = 1;

    // Ensure slug is unique
    while (await Blog.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    const blog = new Blog({
      title,
      slug: uniqueSlug,
      content,
      author: author || 'Alena Studio',
      image,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      categories: categories ? categories.split(',').map(cat => cat.trim()) : [],
      authorBio: {
        name: authorName || 'Mark Grey',
        title: authorTitle || 'Web Designer',
        description: authorDescription || '',
        image: '/images/user/1.jpg'
      }
    });

    await blog.save();
    console.log(`Blog created with slug: ${uniqueSlug}`);
    res.redirect('/blogs');
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).render('add-blog', { error: 'Server Error: Unable to create blog' });
  }
};

// Get single blog details
exports.getBlogDetails = async (req, res) => {
  try {
    const slug = req.params.slug;
    console.log('Requested slug:', slug); // Debug log

    // Check if slug looks like an ObjectId
    if (mongoose.Types.ObjectId.isValid(slug)) {
      console.log('Invalid slug format: ObjectId detected instead of slug');
      return res.status(404).render('error', { message: 'Invalid blog URL. Please use the blog slug.' });
    }

    const blog = await Blog.findOne({ slug }).populate({
      path: 'comments',
      populate: { path: 'parentComment' }
    }).lean();

    if (!blog) {
      console.log('Blog not found for slug:', slug);
      return res.status(404).render('error', { message: `Blog not found for slug: ${slug}` });
    }

    res.render('blog-detail', { blog ,session:req.session});
  } catch (error) {
    console.error('Error fetching blog details:', error);
    res.status(500).render('error', { message: 'Server Error: Unable to fetch blog details' });
  }
};

// Add new comment
exports.postComment = async (req, res) => {
  try {
    const { name, email, subject, phone, message, parentComment } = req.body;
    const slug = req.params.slug;

    if (!name || !email || !message) {
      const blog = await Blog.findOne({ slug }).lean();
      return res.status(400).render('blog-detail', {
        blog,
        error: 'Name, email, and message are required'
      });
    }

    const comment = new Comment({
      name,
      email,
      subject,
      phone,
      message,
      parentComment: parentComment || null
    });

    await comment.save();

    const blog = await Blog.findOne({ slug });
    if (!blog) {
      return res.status(404).render('error', { message: 'Blog not found' });
    }

    blog.comments.push(comment._id);
    await blog.save();

    res.redirect(`/blogs/${slug}`);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).render('error', { message: 'Server Error: Unable to add comment' });
  }
};

// Increment likes
exports.likeBlog = async (req, res) => {
  try {
    const slug = req.params.slug;
    const blog = await Blog.findOne({ slug });
    if (!blog) {
      return res.status(404).render('error', { message: 'Blog not found' });
    }

    blog.likes += 1;
    await blog.save();
    res.redirect(`/blogs/${blog.slug}`);
  } catch (error) {
    console.error('Error liking blog:', error);
    res.status(500).render('error', { message: 'Server Error: Unable to like blog' });
  }
};