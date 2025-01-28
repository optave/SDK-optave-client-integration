import path from 'path';

export default {
	entry: './src/main.js',
	output: {
		filename: 'optave.client.sdk.js',
		path: path.resolve('dist'),
		library: {
			name: 'OptaveJavascriptSDK',
			type: 'umd',
		},
		libraryExport: 'default',
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
