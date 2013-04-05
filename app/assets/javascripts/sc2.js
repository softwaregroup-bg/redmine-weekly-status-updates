function sublimeTextPush(args){
    if(args.file.extension == 'css'){
        var css = document.getElementsByTagName('link');
        for(i in css){
            if((css[i].type == 'text/css') || (css[i].rel == 'stylesheet')){
                css[i].href = css[i].href.replace(/(\?\&bm\=[\d\.]+)?/ig, '') + '\?&bm=' + Math.random();
            }
        };
    } else if(args.file.extension == 'js') {
        window.location.reload();
    }
};