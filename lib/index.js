var fs = require('fs'),
	path = require('path');

var rootPath = '';
var requireMsgs = {};

function contains(obj, key){
	for(item in obj){
		if(key === item){
			return true;
		}
	}
	return false;
}

function handleSubDir(srcDir){
	fs.readdirSync(srcDir).forEach(function(file){
		var filePath = path.join(srcDir, file);
		if(fs.statSync(filePath).isDirectory()){
			handleSubDir(filePath);
		}else{
			genRequireFromFile(filePath);
		}
	})
}

function genRequireFromFile(srcFile){
	var content = fs.readFileSync(srcFile).toString();
	var requireRegExp = /.*require\s*\(['"](.+?)['"]\)/g;
	var requieSentences = content.match(requireRegExp) || [];
	for(var i = 0; i < requieSentences.length; i++){
		if(requieSentences[i].indexOf('module.require') > -1){
			continue;
		}
		var reg = /.*require\s*\(['"](.+?)['"]\)/,
			requireContent = reg.exec(requieSentences[i])[1];
		if(requireContent.indexOf('.') > -1 || fs.existsSync(path.join(rootPath, 'lib', requireContent))){  //不是相对路径（子模块）或者 不是像这样'dom/base'引用子模块
			continue;
		}
		requireMsgs[requireContent] = 1;
	}
}

function writeRequireInJson(rootPath){
	handleBowerJson(path.join(rootPath, 'bower.json'));
	handlePackageJson(path.join(rootPath, 'package.json'));
}


function handleBowerJson(srcFile){
	if(fs.existsSync(srcFile)){
		var bowerJson = JSON.parse(fs.readFileSync(srcFile).toString()),
			dependencies = bowerJson.dependencies || (bowerJson.dependencies = { });

		for(requireItem in requireMsgs){
			if(!contains(dependencies, requireItem)){
				dependencies[requireItem] = '*';
			}
		}
		for(tmpitem in dependencies){
			if(!contains(requireMsgs, tmpitem) && tmpitem != 'modulex'){
				delete dependencies[tmpitem];
			}
		}

		fs.writeFileSync(srcFile, JSON.stringify(bowerJson, undefined, 4));
		console.log('bower.json done...');
	}else{
		console.log('there is no bower.json...');
	}
}

function handlePackageJson(srcFile){
	if(fs.existsSync(srcFile)){
		var packageJson = JSON.parse(fs.readFileSync(srcFile).toString()),
			dependencies = packageJson.dependencies || (packageJson.dependencies = { });

		for(requireItem in requireMsgs){
			if(!contains(dependencies, requireItem)){
				dependencies[requireItem] = '*';
			}
		}
		for(tmpitem in dependencies){
			if(!contains(requireMsgs, tmpitem) && tmpitem != 'modulex'){
				delete dependencies[tmpitem];
			}
		}

		fs.writeFileSync(srcFile, JSON.stringify(packageJson, undefined, 4));
		console.log('package.json done...');
	}else{
		console.log('there is no package.json...');
	}
}

function AutoDeps(root){
	rootPath = root || '.';
	var libPath = path.join(rootPath, 'lib/');
	fs.readdirSync(libPath).forEach(function(file){
		var filePath = path.join(libPath, file);
		if(fs.statSync(filePath).isDirectory()){
			handleSubDir(filePath);
		}else{
			genRequireFromFile(filePath);
		}
	});

	writeRequireInJson(rootPath);
}

module.exports = AutoDeps;