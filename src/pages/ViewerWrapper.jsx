import { useSearchParams, useNavigate } from 'react-router-dom';
import Viewer from './Viewer';

export default function ViewerWrapper() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const env = searchParams.get('env');

  return <Viewer env={env} navigate={navigate} />;
}
