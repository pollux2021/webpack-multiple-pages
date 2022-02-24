const glob = require("glob")
const path = require("path")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const { CleanWebpackPlugin } = require("clean-webpack-plugin")

const IS_DEV = process.env.NODE_ENV !== "production"
const PAGES_PATH = "pages" // 页面目录
const OUTPUT_PUBLIC_PATH = IS_DEV ? "/" : "/"

// 多页面应用动态配置
const getEntrys = () => {
	const entry = {}
	const htmlWebpackPlugins = []
	const entryFiles = glob.sync(path.join(__dirname, "./src/pages/*/index.ts"))

	Object.keys(entryFiles).map(index => {
		const entryFile = entryFiles[index]
		const match = entryFile.match(/src\/(.*)\/index\.ts/)
		const pageName = (match && match[1]).replace(`${PAGES_PATH}/`, "")

		entry[pageName] = entryFile
		htmlWebpackPlugins.push(
			new HtmlWebpackPlugin({
				inlineSource: ".css$",
				template: path.join(
					__dirname,
					`src/${PAGES_PATH}/${pageName}/index.html`
				),
				filename: `${pageName}.html`,
				chunks: ["vendors", pageName],
				inject: true,
				minify: {
					html5: false,
					collapseWhitespace: false,
					preserveLineBreaks: false,
					minifyCSS: true,
					minifyJS: true,
					removeComments: false,
				},
			})
		)
	})

	return {
		entry,
		htmlWebpackPlugins,
	}
}

const { entry, htmlWebpackPlugins } = getEntrys()

module.exports = {
	entry,
	output: {
		publicPath: OUTPUT_PUBLIC_PATH,
		path: path.join(__dirname, "dist"),
		filename: "[name]_[chunkhash:8].js",
	},
	mode: process.env.NODE_ENV,
	resolve: {
		extensions: ["*", ".ts", ".js", ".less"],
		alias: {
			"@": path.resolve(__dirname, "./src/"),
		},
	},
	module: {
		rules: [
			{
				test: /.html$/,
				use: "inline-html-loader",
			},
			{
				test: /.js$/,
				use: ["babel-loader"],
			},
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
			{
				test: /.less$/i,
				use: [
					{
						loader: MiniCssExtractPlugin.loader,
						options: {
							// 这里可以指定一个 publicPath
							// 默认使用 webpackOptions.output中的publicPath
							// publicPath的配置，和plugins中设置的filename和chunkFilename的名字有关
							// 如果打包后，background属性中的图片显示不出来，请检查publicPath的配置是否有误
							publicPath: "./",
							emit: true, // 仅dev环境启用HMR功能
						},
					},
					"css-loader",
					"less-loader",
					{
						loader: "style-resources-loader",
						options: {
							patterns: path.resolve(__dirname, "./src/styles/_variable.less"),
						},
					},
				],
			},
			{
				test: /.(woff|woff2|eot|ttf|otf)$/,
				use: [
					{
						loader: "inline-file-loader",
						options: {
							name: "[name]_[hash:8][ext]",
						},
					},
				],
			},
		],
	},
	plugins: [new MiniCssExtractPlugin(), new CleanWebpackPlugin()].concat(
		htmlWebpackPlugins
	),
	stats: "errors-only",
}
