var app = new Vue({
    el: '#app-main-gallery',
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
        axios.get("http://localhost:3000/petite/galleries").then(response => {
            this.galleries = response.data;
        });
    },
    methods: {
        setDownload: function (galleryId) {
            let vm = this;
            axios.post(`http://localhost:3000/petite/admin/download/${
                galleryId
            }`).then(response => {
                vm.processResponseMesage(response);
            }).catch(e => {
                vm.processResponseMesage(e);
            });
        },
        deleteGallery: function (galleryId) {
            let vm = this;
            if (confirm('Delete?')) {
                axios.delete(`http://localhost:3000/petite/admin/deleteMainGallery/${
                galleryId
            }`).then(response => {
                    vm.processResponseMesage(response)
                }).catch(e => {
                    vm.processResponseMesage(e)
                });
            }
        },
        processResponseMesage: function (response) {
            let vm = this;
            if (response.data && response.data.status === "done") {               
                vm.alerts.success.show = true;
                vm.alerts.success.message = `${response.data.message}`;
                setTimeout(() => {
                    vm.alerts.success.show = false;
                    vm.alerts.success.message = "";
                }, 5000);
            } else {
                if (response.data && response.data.message) {
                    vm.alerts.error.show = true;
                    vm.alerts.error.message = `${response.data.message}`;
                    setTimeout(() => {
                        vm.alerts.error.show = false;
                        vm.alerts.error.message = "";
                    }, 10000);
                } else {
                    console.log(response);
                    vm.alerts.error.show = true;
                    vm.alerts.error.message = response.message
                    setTimeout(() => {
                        vm.alerts.error.show = false;
                        vm.alerts.error.message = "";
                    }, 10000);
                }
            }
        },
    }
});