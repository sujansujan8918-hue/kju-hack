const express = require('express');
const router = express.Router();
const {
  scheduleConsultation,
  getMyConsultations,
  getConsultation,
  updateConsultationStatus,
  saveEmotionData,
  saveSpeechAnalysis
} = require('../controllers/consultationController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Consultation CRUD
router.post('/schedule', scheduleConsultation);
router.get('/my-consultations', getMyConsultations);
router.get('/:id', getConsultation);
router.put('/:id/status', updateConsultationStatus);

// AI Data endpoints
router.post('/:consultationId/emotion', saveEmotionData);
router.post('/:consultationId/speech', saveSpeechAnalysis);

module.exports = router;