const path = require('path');

const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const pkg = require('./package.json');

const isProduction = process.env.NODE_ENV === 'production';
const FILENAME = pkg.name + (isProduction ? '.min' : '');

module.exports = {
	devtool: isProduction ? 'inline-source-map' : 'cheap-module-source-map',
	devServer: {
		open: false,
		hot: true,
	},
	mode: isProduction ? 'production' : 'development',
	entry: ['./src/index.css', './src/index.ts'],
	output: {
		library: ['ISpreadSheet'],
		libraryTarget: 'umd',
		libraryExport: 'default',
		filename: `${FILENAME}.js`,
		path: path.join(__dirname, 'dist'),
	},
	optimization: {
		minimize: isProduction,
		minimizer: [
			new TerserPlugin({
				extractComments: false,
			}),
			new CssMinimizerPlugin(),
		],
	},
	resolve: {
		modules: ['node_modules'],
		extensions: ['.js', '.ts'],
	},
	module: {
		rules: [
			{
				test: /\.(js|jsx|ts|tsx)$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env', '@babel/preset-typescript'],
						plugins: ['@babel/plugin-proposal-class-properties'],
					},
				},
			},
			{
				test: /\.css$/,
				use: [
					MiniCssExtractPlugin.loader,
					{
						loader: 'css-loader',
						options: {
							sourceMap: true,
						},
					},
					{
						loader: 'postcss-loader',
						options: {
							sourceMap: true,
							postcssOptions: {
								plugins: ['autoprefixer', ['postcss-prefixer', { prefix: `${pkg.name}-` }]],
							},
						},
					},
				],
			},
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: 'public/index.html',
			...(isProduction
				? {
						inject: false,
						minify: {
							removeComments: true,
							collapseWhitespace: true,
							removeRedundantAttributes: true,
							useShortDoctype: true,
							removeEmptyAttributes: true,
							removeStyleLinkTypeAttributes: true,
							keepClosingSlash: true,
							minifyJS: true,
							minifyCSS: true,
							minifyURLs: true,
						},
				  }
				: {
						inject: false,
						minify: false,
				  }),
		}),
		new MiniCssExtractPlugin({
			filename: `${FILENAME}.css`,
		}),
	],
};
