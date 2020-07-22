var app = new Vue({
    el: '#app-main-gallery',
    data: {
        galleries: []
    },
    mounted() {
        let uri = window.location.search.substring(1);
        let params = new URLSearchParams(uri);
        console.log(params.get("id"));

        axios.get(`http://localhost:3000/petite/subgalleries/${
            params.get("id").trim()
        }`).then(response => {
            this.galleries = response.data;
        }).catch(e => console.log(e));
    }
})