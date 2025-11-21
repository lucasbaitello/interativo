import { useSearchParams } from 'react-router-dom';

export default function TestSearchParams() {
  const [searchParams] = useSearchParams();
  const env = searchParams.get('env');

  return (
    <div>
      <h1>Test Search Params</h1>
      <p>The "env" search param is: {env}</p>
    </div>
  );
}
