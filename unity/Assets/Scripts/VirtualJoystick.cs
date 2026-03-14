using UnityEngine;
using UnityEngine.EventSystems;

public class VirtualJoystick : MonoBehaviour, IPointerDownHandler, IDragHandler, IPointerUpHandler
{
    public RectTransform knob;
    public float radius = 60f;

    public Vector2 Value { get; private set; }

    public void OnPointerDown(PointerEventData eventData)
    {
        OnDrag(eventData);
    }

    public void OnDrag(PointerEventData eventData)
    {
        RectTransform rect = transform as RectTransform;
        if (rect == null || knob == null) return;

        Vector2 localPoint;
        if (!RectTransformUtility.ScreenPointToLocalPointInRectangle(rect, eventData.position, eventData.pressEventCamera, out localPoint))
            return;

        Vector2 clamped = Vector2.ClampMagnitude(localPoint, radius);
        knob.anchoredPosition = clamped;
        Value = clamped / radius;
    }

    public void OnPointerUp(PointerEventData eventData)
    {
        if (knob != null) knob.anchoredPosition = Vector2.zero;
        Value = Vector2.zero;
    }
}
