// server.js
// install: npm i express cors @prisma/client dotenv

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const port = 3000;

// Allow all origins for CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// GET / - simple health check
app.get('/', (req, res) => {
  res.send('Satellite Builder API Server is running on port 3000');
});

// POST /api/save-satellite
app.post('/api/save-satellite', async (req, res) => {
  try {
    if(req.body){
      console.log('aris')
    }else{
      console.log('ar aris')
    }
    console.log(req.body, 'dddd')
    const { components, model } = req.body;
    console.log('komp', model)
    const satellite = await prisma.satellite.create({
      data: {
        model : "",
        components: {
          create: components.map(c => ({
            componentId: c.id,
            name: c.name,
            category: c.category,
            icon: c.icon ?? '',
            mass: Number(c.mass),
            power: Math.trunc(c.power),
            color: Math.trunc(c.color),
            instanceId: String(c.instanceId),
            position: c.position,
            rotation: c.rotation,
            scale: Number(c.scale),
          })),
        },
      },
      include: { components: true },
    });

    console.log(satellite, 'sat')

    res.status(201).json({ message: 'Satellite saved successfully', data : satellite });
  } catch (error) {
    console.error('Error saving satellite:', { code: error.code, message: error.message, meta: error.meta });
    res.status(500).json({ error: 'Failed to save satellite' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
