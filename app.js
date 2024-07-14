const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require("body-parser");
const PORT = 3000;

const app = express();

app.use(bodyParser.json())
app.use(cors());
// Set up multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
      cb(null, 'image.jpg');
  }
});

const upload = multer({ storage: storage });

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to handle image upload
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const imagePath = path.join(__dirname, 'uploads', 'image.jpg');

  // Generate content using GoogleGenerativeAI
  try {
      const generatedText = await generateContent(imagePath);
      res.json({ success: true, url: `/uploads/${req.file.filename}`, text: generatedText });
  } catch (error) {
      return res.status(500).json({ success: false, message: 'Error generating content' });
  }
});

app.post('/get-products',async (req,res)=> {
  const genAI = new GoogleGenerativeAI("AIzaSyCKL8sFcd6vVbDh3hgweSwB5Ud4MrVB9bI");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  const prompt = "Find me three products to solve " + req.body.problem + "with " + req.body.spending_amount + " and just give me the name of the products, no additional filler text. Divide the product with two spaces";

  const result = await model.generateContent(prompt);

  const product = result.response.text();
  res.json({products:product});
})

app.get('/get-routine', async (req,res)=> {
  const genAI = new GoogleGenerativeAI("AIzaSyCKL8sFcd6vVbDh3hgweSwB5Ud4MrVB9bI");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  prompt = "Give me a 7-item daily routine for skincare, with each item containing the time to do it and 3-4 words about what the item is (such as 4:30 pm;wash with cleanser). give me just the routine and no additional text, and separate each item with a slash";
  
  const result = await model.generateContent(prompt);
  const routine = result.response.text();
  
  res.json({routine:routine});

})
// Serve the upload directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const { GoogleGenerativeAI } = require("@google/generative-ai");

async function generateContent(imagePath) {
  const fetchModule = await import('node-fetch');
  const fetch = fetchModule.default;
  const { Headers, Request, Response } = fetchModule;

  global.fetch = fetch;
  global.Headers = Headers;
  global.Request = Request;
  global.Response = Response;

  const genAI = new GoogleGenerativeAI("AIzaSyCKL8sFcd6vVbDh3hgweSwB5Ud4MrVB9bI");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  prompt = "In one sentence: give a description of this person's skin condition, like if he has acne or blemishes";


  prompt2 = "Give a detailed description of this person's skin condition and any issues, such as acne, blemishes, or scars";

  const image = {
    inlineData: {
      data: Buffer.from(fs.readFileSync(imagePath)).toString("base64"),
      mimeType: "image/jpeg",
    },
  };

  try {
    let result = await model.generateContent([prompt, image]);
    result = result.response.text();
    let detailedResult = await model.generateContent([prompt2,image]);
    detailedResult = detailedResult.response.text();
    let dataReturn = {"result": result, "detailedResult": detailedResult}
    return dataReturn
  } catch (error) {
    console.error(error);
    throw error;
  }
}
