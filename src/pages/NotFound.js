import { Link } from 'react-router-dom';


export default function ErrorPage(){
	return (
		<>
		<h1>Page Not Found</h1>
		<p className="d-inline">Go back to the </p>
		<Link  style={{textDecoration: 'none'}} to="/" exact='true'>homepage.</Link>
		</>	
	)
};