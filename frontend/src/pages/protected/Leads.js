import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../features/common/headerSlice';
import Leads from '../../features/leads';

function InternalPage() {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle({ title: "Livraisons LE - LS" }));
    }, []);

    return (
        <Leads />
    );
}

export default InternalPage;