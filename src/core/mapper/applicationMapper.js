export const ApplicationMapper = {
    toUI(data){
        console.log('here')
        const application = {
            applicantName: data.applicant?.name ?? null,
            userId: data.applicant?.id ?? null,
            email: data.applicant?.email ?? null,
            validId: data.applicant?.validId ?? null,
            businessName: data.business?.name ?? null,
            address: data.business?.address ?? null,
            servicedLocation: data.business?.servicedLocation ?? null,
            establishedOn: data.business?.establishedOn ?? null,
            ...data.documents ?? null,
            id: data.id,
        }
        return application;
    },
    toDB(data){
        const application = {
            id: data.id,
            applicant: {
                name: data.applicantName,
                email: data.email,
                id: data.userId,
                validId: data.validId,
            }, 
            business: {
                name: data.businessName,
                address: data.address,
                servicedLocation: data.servicedLocation,
                establishedOn: data.establishedOn,
            },
            documents: {
                denr: data.denr,
                dti: data.dti,
                bir: data.bir,
            }
        }

        return application;
    }
}