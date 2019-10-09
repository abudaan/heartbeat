'use strict';

var mdFiles = [],
  fs = require('fs'),
  path = require('path'),
  jsdom = require('jsdom'),
  exec = require('child_process').exec, child,
  pagedown = require('pagedown'),
  converter = new pagedown.Converter(),
  safeConverter = pagedown.getSanitizingConverter(),

  header = fs.readFileSync(path.resolve('../site/header.html')),
  footer = fs.readFileSync(path.resolve('../site/footer.html')),
  folders = [
    path.resolve('../docs'),
    path.resolve('../api')
  ];


function walk(dir, files, indent) {

  var file, list, stat, i, maxi;

  list = fs.readdirSync(dir);

  if (list) {
    maxi = list.length;
    //console.log(indent, dir, maxi);
    for (i = 0; i < maxi; i++) {
      file = list[i];
      file = dir + path.sep + file;
      stat = fs.statSync(file);
      if (stat) {
        if (stat.isDirectory()) {
          walk(file, files, indent + '_');
        } else {
          if (file.indexOf('.md') !== -1) {
            //console.log(file);
            files.push(file);
          }
        }
      }
    }
  }
}


function cleanup(i, maxi, callback) {
  var folder;
  if (i < maxi) {
    folder = folders[i];
    child = exec('rm -rf ' + folder, function (err, out) {
      fs.mkdirSync(folder);
      cleanup(++i, maxi, callback);
      // create an index file that redirects to the first subitem page (or may be create a real index)
      fs.writeFileSync(folder + path.sep + 'index.html', header + '\n' + footer, 'utf-8');
    });
  } else {
    callback();
  }
}

cleanup(0, 2, function () {
  walk(path.resolve('../site/md/'), mdFiles, '_');
  parse();
});


function parse() {
  var i,
    numFiles = mdFiles.length,
    p,
    name,
    dirName,
    extension,
    mdFile,
    htmlFile,
    mdData,
    htmlData;

  //console.log(mdFiles);
  for (i = 0; i < numFiles; i++) {

    mdFile = mdFiles[i];
    htmlFile = mdFile.replace('site' + path.sep + 'md' + path.sep, '');
    htmlFile = htmlFile.replace('.md', '.html');
    htmlFile = path.resolve(htmlFile);

    //console.log(mdFile, htmlFile);
    //console.log(path.extname(htmlFile), path.basename(htmlFile), path.dirname(htmlFile));

    extension = path.extname(htmlFile);
    name = path.basename(htmlFile).replace(extension, '');
    dirName = path.dirname(htmlFile) + path.sep + name;

    fs.mkdirSync(dirName);
    htmlFile = dirName + path.sep + 'index.html';

    mdData = fs.readFileSync(mdFile);
    mdData = mdData.toString();
    mdData = markup(mdData);
    mdData = converter.makeHtml(mdData);

    htmlData = header + '\n';
    htmlData += mdData + '\n';
    htmlData += footer;

    fs.writeFileSync(htmlFile, htmlData, 'utf-8');

    if (dirName.indexOf('/api/') !== -1) {
      jsdom.env({
        file: htmlFile,
        done: function (errors, window) {
          var document = window.document;
          var nodes = document.querySelectorAll('*');
          var node, i, maxi = nodes.length;
          for (i = 0; i < maxi; i++) {
            node = nodes[i];
            if (node.firstChild !== null) {
              if (node.firstChild.nodeType === 3) {
                if (node.firstChild.nodeValue === 'properties') {
                  //console.log('properties');
                  // add properties to navigation items objects
                } else if (node.firstChild.nodeValue === 'methods') {
                  //console.log('methods');
                  // add methods to navigation items objects
                }
              }
            }
          }
          //console.log(errors);
        }
      })
    }
  }
}


function markup(data) {
  var lines = data.split('\n'),
    open = true,
    result = '',
    match;

  lines.forEach(function (line) {
    if (line.indexOf('```') !== -1) {

      if (open === true) {
        line = line.replace(/```[\n]*/, '<pre><code class="language-javascript">');
        result += line + '\n';
        open = false;
      } else {
        line = line.replace(/```/, '</code></pre>');
        result += line + '\n';
        open = true;
      }

    } else if (line.indexOf('`') !== -1) {
      /*
                  // testing:
                  //var re = /(`)[ -+_\(\)\{\}\[\]a-zA-Z0-9]*(`)/g;
                  var re = /`([^`])`/g;
                  var result;
                  var i = 0;
                  while ((result = re.exec(line)) !== null){
                      if(i % 2 === 0){
                          //line = line.substring()
                      }
                      console.log('index', result);
                  }
      */

      /*
                  // old method:
                  line = line.replace(/`/, '<code class="language-javascript">');
                  line = line.replace(/`/, '</code>');
      */

      //line = line.replace(/`([ <>=\`\"\-+_\(\)\{\}\[\]a-zA-Z0-9]*)`/g, '<code class="language-javascript">$1</code>');
      line = line.replace(/`([^`]*)`/g, '<code class="language-javascript">$1</code>');
      //console.log(line);
      result += line + '\n';

    } else {
      match = line.match(/#{2,}[ A-Za-z0-9]+/);
      if (match) {
        match = match.input.replace(/#{1,}[\ ]*/, '');
        // /console.log(match);
        match = match.replace(/\ /g, '-');
        match = match.replace(/:/g, '');
        match = match.replace(/\([^\)]*\)/g, '');
        result += '\n<a name="' + match + '"></a>\n';
        //console.log(match, line);
        /*
                        match = match.replace(/\ /g, '-');
                        match = match.replace(/\(/g, '');
                        match = match.replace(/\)/g, '');
                        result += '\n<a name="' + match.toLowerCase() + '"></a>\n';
        */
      }
      result += line + '\n';
    }
  });
  result = result.replace(/<pre><code class="language-javascript">[\n]*/g, '<pre><code class="language-javascript">');
  return result;
}
