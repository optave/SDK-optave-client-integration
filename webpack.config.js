const path = require('path');

module.exports = {
	entry: './src/main.js',
	output: {
		filename: 'optave.client.sdk.js',
		path: path.resolve(__dirname, 'dist'),
		library: {
			name: 'OptaveClientSDK',
			type: 'umd',
		},
		globalObject: 'this',
	},
	mode: 'development',
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env'],
					},
				},
			},
		],
	},
};
