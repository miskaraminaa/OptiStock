import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import Charts from '../../features/charts'
import { setPageTitle } from '../../features/common/headerSlice'

function InternalPage(){
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(setPageTitle({ title: "Tableau de bord des KPI"}))
      }, [])


    return(
        <Charts />
    )
}

export default InternalPage