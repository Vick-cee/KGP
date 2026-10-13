import {
  getAllGates,
  getGateById,
  createGate,
  updateGate,
  getAllOfficers,
  createOfficer,
  assignOfficerToGate,
  unassignOfficerFromGate,
  deleteOfficer,
  getOfficerAssignedGate,
} from '../controllers/gateController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// General / Public gate list (for display/selection)
router.get('/', authenticateToken, getAllGates);
router.get('/my-assignment', authenticateToken, authorizeRoles('GATE_OFFICER'), getOfficerAssignedGate);
router.get('/details/:id', authenticateToken, getGateById);

// Admin-only gate management
router.post('/', authenticateToken, authorizeRoles('ADMIN'), createGate);
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), updateGate);

// Gate officer management (Admin can assign, unassign, add, and remove officers anytime)
router.get('/officers', authenticateToken, authorizeRoles('ADMIN'), getAllOfficers);
router.post('/officers', authenticateToken, authorizeRoles('ADMIN'), createOfficer);
router.put('/officers/:officerId/assign', authenticateToken, authorizeRoles('ADMIN'), assignOfficerToGate);
router.put('/officers/:officerId/unassign', authenticateToken, authorizeRoles('ADMIN'), unassignOfficerFromGate);
router.delete('/officers/:officerId', authenticateToken, authorizeRoles('ADMIN'), deleteOfficer);

export default router;
