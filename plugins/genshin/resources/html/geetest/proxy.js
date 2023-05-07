const origOpen = window.XMLHttpRequest.prototype.open;

function newOpen() {
    this.addEventListener("load", function () {
        console.log(this.responseText);
    });
    origOpen.apply(this, arguments);
}

window.XMLHttpRequest.prototype.open = newOpen;
const origFetch = window.fetch;

window.fetch = function () {
    return origFetch.apply(this, arguments)
        .then(response => {
            console.log(response);
            return response;
        });
};
Object.defineProperty(window, 'fetch', {
    set: function (value) {
        console.log('fetch被修改')
    }
})