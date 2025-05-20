deploy:
	npm run build
	/usr/local/bin/aws s3 sync dist/ s3://carcassonne-react
