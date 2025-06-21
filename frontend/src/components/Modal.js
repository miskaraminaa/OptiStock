import { useSelector, useDispatch } from 'react-redux';
import { closeModal } from '../common/modalSlice';
import { MODAL_BODY_TYPES } from '../../utils/globalConstantUtil';
import AddLeadModalBody from '../../features/lead/components/AddLeadModalBody';
import ConfirmationModalBody from '../../features/common/ConfirmationModalBody';
import ImportExcelModalBody from '../../features/imports/components/ImportExcelModalBody';

function Modal() {
    const { isOpen, title, bodyType, extraObject } = useSelector((state) => state.modal);
    const dispatch = useDispatch();

    const close = () => {
        dispatch(closeModal());
    };

    return (
        <>
            {isOpen && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">{title}</h3>
                        <div className="py-4">
                            {bodyType === MODAL_BODY_TYPES.LEAD_ADD_NEW && (
                                <AddLeadModalBody closeModal={close} />
                            )}
                            {bodyType === MODAL_BODY_TYPES.CONFIRMATION && (
                                <ConfirmationModalBody extraObject={extraObject} closeModal={close} />
                            )}
                            {bodyType === MODAL_BODY_TYPES.IMPORT_EXCEL && (
                                <ImportExcelModalBody closeModal={close} />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Modal;