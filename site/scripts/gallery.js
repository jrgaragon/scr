var app = new Vue({
    el: '#gallery',
    data: {
        galleries: [],
        imageId: '',
        alerts: {
            success: {
                message: '',
                show: false
            },
            error: {
                message: '',
                show: false
            }
        }

    },
    mounted() {
        let uri = window.location.search.substring(1);
        let params = new URLSearchParams(uri);
        this.imageId = params.get('id');
        console.log(params.get("id"));

        axios.get(`http://localhost:3000/petite/galleries/${
            this.imageId
        }`).then(response => {
            this.galleries = response.data;
        }).catch(e => console.log(e));
    },
    methods: {
        selectMainImageAsFavorite: function (imageId) {
            let vm = this;
            axios.post(`http://localhost:3000/petite/admin/setMainImage/${
                imageId
            }`).then(response => {
                if (response.data.status === 'done') {
                    vm.alerts.success.show = true;
                    vm.alerts.success.message = `Done: [${
                        response.data.galleryUrl
                    }]`;
                    setTimeout(() => {
                        vm.alerts.success.show = false;
                        vm.alerts.success.message = '';
                    }, 5000)
                }
            }).catch(e => {
                console.log(JSON.stringify(e));
                vm.alerts.error.show = true;
                vm.alerts.error.message = e.response.data.message;
                setTimeout(() => {
                    vm.alerts.error.show = false;
                    vm.alerts.error.message = '';
                }, 10000);
            });
        },
        selectSubImageAsFavorite: function (imageId) {
            let vm = this;
            axios.post(`http://localhost:3000/petite/admin/setSubImage/${
                imageId
            }`).then(response => {
                if (response.data.status === 'done') {
                    vm.alerts.success.show = true;
                    vm.alerts.success.message = `Done: [${
                        response.data.galleryUrl
                    }]`;
                    setTimeout(() => {
                        vm.alerts.success.show = false;
                        vm.alerts.success.message = '';
                    }, 5000)
                }
            }).catch(e => {
                console.log(JSON.stringify(e));
                vm.alerts.error.show = true;
                vm.alerts.error.message = e.response.data.message;
                setTimeout(() => {
                    vm.alerts.error.show = false;
                    vm.alerts.error.message = '';
                }, 10000);
            });
        },
        markAsFavorite: function (imageId) {}
    }
});